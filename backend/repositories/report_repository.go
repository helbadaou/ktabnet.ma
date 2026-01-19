package repositories

import (
	"database/sql"
	"time"

	"social/models"
)

type ReportRepository struct {
	DB *sql.DB
}

func NewReportRepository(db *sql.DB) *ReportRepository {
	return &ReportRepository{DB: db}
}

func (r *ReportRepository) Create(report models.Report) (int, error) {
	result, err := r.DB.Exec(`
		INSERT INTO reports (reporter_id, reported_type, reported_id, reason, description, status)
		VALUES (?, ?, ?, ?, ?, 'pending')
	`, report.ReporterID, report.ReportedType, report.ReportedID, report.Reason, report.Description)
	if err != nil {
		return 0, err
	}
	id, err := result.LastInsertId()
	return int(id), err
}

func (r *ReportRepository) GetByID(id int) (*models.Report, error) {
	var report models.Report
	var resolvedAt sql.NullTime
	var resolvedBy sql.NullInt64
	var adminNotes sql.NullString

	err := r.DB.QueryRow(`
		SELECT id, reporter_id, reported_type, reported_id, reason, description, 
		       status, admin_notes, created_at, resolved_at, resolved_by
		FROM reports WHERE id = ?
	`, id).Scan(
		&report.ID, &report.ReporterID, &report.ReportedType, &report.ReportedID,
		&report.Reason, &report.Description, &report.Status, &adminNotes,
		&report.CreatedAt, &resolvedAt, &resolvedBy,
	)
	if err != nil {
		return nil, err
	}

	if adminNotes.Valid {
		report.AdminNotes = adminNotes.String
	}
	if resolvedAt.Valid {
		report.ResolvedAt = &resolvedAt.Time
	}
	if resolvedBy.Valid {
		val := int(resolvedBy.Int64)
		report.ResolvedBy = &val
	}

	return &report, nil
}

func (r *ReportRepository) GetAll(status string) ([]models.ReportWithDetails, error) {
	query := `
		SELECT r.id, r.reporter_id, r.reported_type, r.reported_id, r.reason, 
		       r.description, r.status, r.admin_notes, r.created_at, r.resolved_at, r.resolved_by,
		       u.first_name || ' ' || u.last_name as reporter_name,
		       COALESCE(u.avatar, '') as reporter_avatar
		FROM reports r
		JOIN users u ON r.reporter_id = u.id
	`
	args := []interface{}{}

	if status != "" && status != "all" {
		query += " WHERE r.status = ?"
		args = append(args, status)
	}

	query += " ORDER BY r.created_at DESC"

	rows, err := r.DB.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []models.ReportWithDetails
	for rows.Next() {
		var report models.ReportWithDetails
		var resolvedAt sql.NullTime
		var resolvedBy sql.NullInt64
		var adminNotes sql.NullString
		var description sql.NullString

		err := rows.Scan(
			&report.ID, &report.ReporterID, &report.ReportedType, &report.ReportedID,
			&report.Reason, &description, &report.Status, &adminNotes,
			&report.CreatedAt, &resolvedAt, &resolvedBy,
			&report.ReporterName, &report.ReporterAvatar,
		)
		if err != nil {
			return nil, err
		}

		if description.Valid {
			report.Description = description.String
		}
		if adminNotes.Valid {
			report.AdminNotes = adminNotes.String
		}
		if resolvedAt.Valid {
			report.ResolvedAt = &resolvedAt.Time
		}
		if resolvedBy.Valid {
			val := int(resolvedBy.Int64)
			report.ResolvedBy = &val
		}

		// Get reported item name
		report.ReportedName = r.getReportedName(report.ReportedType, report.ReportedID)

		reports = append(reports, report)
	}

	return reports, nil
}

func (r *ReportRepository) getReportedName(reportedType string, reportedID int) string {
	if reportedType == "book" {
		var title string
		r.DB.QueryRow("SELECT title FROM books WHERE id = ?", reportedID).Scan(&title)
		return title
	} else if reportedType == "user" {
		var name string
		r.DB.QueryRow("SELECT first_name || ' ' || last_name FROM users WHERE id = ?", reportedID).Scan(&name)
		return name
	}
	return ""
}

func (r *ReportRepository) Update(id int, status string, adminNotes string, resolvedBy int) error {
	var resolvedAt interface{}
	if status == "resolved" || status == "dismissed" {
		resolvedAt = time.Now()
	}

	_, err := r.DB.Exec(`
		UPDATE reports 
		SET status = ?, admin_notes = ?, resolved_at = ?, resolved_by = ?
		WHERE id = ?
	`, status, adminNotes, resolvedAt, resolvedBy, id)
	return err
}

func (r *ReportRepository) Delete(id int) error {
	_, err := r.DB.Exec("DELETE FROM reports WHERE id = ?", id)
	return err
}

func (r *ReportRepository) GetUserRole(userID int) (string, error) {
	var role sql.NullString
	err := r.DB.QueryRow("SELECT role FROM users WHERE id = ?", userID).Scan(&role)
	if err != nil {
		return "", err
	}
	if !role.Valid {
		return "user", nil
	}
	return role.String, nil
}

func (r *ReportRepository) SetUserRole(userID int, role string) error {
	_, err := r.DB.Exec("UPDATE users SET role = ? WHERE id = ?", role, userID)
	return err
}

func (r *ReportRepository) DeleteBook(bookID int) error {
	// First delete book images
	_, err := r.DB.Exec("DELETE FROM book_images WHERE book_id = ?", bookID)
	if err != nil {
		return err
	}
	// Then delete the book
	_, err = r.DB.Exec("DELETE FROM books WHERE id = ?", bookID)
	return err
}

func (r *ReportRepository) GetAllUsers() ([]models.UserAdmin, error) {
	rows, err := r.DB.Query(`
		SELECT id, email, first_name, last_name, nickname, avatar, city, COALESCE(role, 'user') as role, created_at
		FROM users
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.UserAdmin
	for rows.Next() {
		var user models.UserAdmin
		var nickname, avatar, city sql.NullString
		err := rows.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName, &nickname, &avatar, &city, &user.Role, &user.CreatedAt)
		if err != nil {
			return nil, err
		}
		if nickname.Valid {
			user.Nickname = nickname.String
		}
		if avatar.Valid {
			user.Avatar = avatar.String
		}
		if city.Valid {
			user.City = city.String
		}
		users = append(users, user)
	}
	return users, nil
}

func (r *ReportRepository) DeleteUser(userID int) error {
	// Delete user's books first
	_, err := r.DB.Exec("DELETE FROM book_images WHERE book_id IN (SELECT id FROM books WHERE owner_id = ?)", userID)
	if err != nil {
		return err
	}
	_, err = r.DB.Exec("DELETE FROM books WHERE owner_id = ?", userID)
	if err != nil {
		return err
	}
	// Delete user
	_, err = r.DB.Exec("DELETE FROM users WHERE id = ?", userID)
	return err
}
