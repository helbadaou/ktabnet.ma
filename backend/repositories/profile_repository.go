package repositories

import (
	"database/sql"
	"social/models"
	"strings"
)

type SqliteProfileRepo struct {
	db *sql.DB
}

func NewProfileRepository(db *sql.DB) *SqliteProfileRepo {
	return &SqliteProfileRepo{db: db}
}

func (r *SqliteProfileRepo) GetByID(userID int) (*models.User, error) {
	query := `
		SELECT id, email, first_name, last_name, date_of_birth,
		       nickname, about, avatar, city, COALESCE(role, 'user') as role, 
		       COALESCE(is_private, 0) as is_private, COALESCE(is_banned, 0) as is_banned
		FROM users
		WHERE id = ?;
	`

	var user models.User
	err := r.db.QueryRow(query, userID).Scan(
		&user.ID,
		&user.Email,
		&user.FirstName,
		&user.LastName,
		&user.DateOfBirth,
		&user.Nickname,
		&user.About,
		&user.Avatar,
		&user.City,
		&user.Role,
		&user.IsPrivate,
		&user.IsBanned,
	)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *SqliteProfileRepo) FindByID(userID int) (*models.Profile, error) {
	row := r.db.QueryRow(`
		SELECT id, first_name, last_name, nickname, email, about, avatar, date_of_birth, COALESCE(is_private, 0) as is_private
		FROM users WHERE id = ?
	`, userID)

	var user models.Profile
	err := row.Scan(
		&user.ID, &user.FirstName, &user.LastName, &user.Nickname,
		&user.Email, &user.About, &user.Avatar, &user.DateOfBirth, &user.IsPrivate,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *SqliteProfileRepo) IsFollowing(followerID, followedID int) (bool, error) {
	var status string
	err := r.db.QueryRow(`
		SELECT status FROM followers
		WHERE follower_id = ? AND followed_id = ?
	`, followerID, followedID).Scan(&status)

	if err != nil {
		return false, err
	}
	return status == "accepted", nil
}

func (r *SqliteProfileRepo) IsPending(followerID, followedID int) (bool, error) {
	var status string
	err := r.db.QueryRow(`
		SELECT status FROM followers
		WHERE follower_id = ? AND followed_id = ?
	`, followerID, followedID).Scan(&status)

	if err != nil {
		return false, err
	}
	return status == "pending", nil
}

func (ur *SqliteProfileRepo) SearchUsers(query string) ([]models.SearchResult, error) {
	search := "%" + strings.ToLower(query) + "%"
	rows, err := ur.db.Query(`
		SELECT id, first_name, last_name, nickname
		FROM users
		WHERE LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(nickname) LIKE ?
	`, search, search, search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.SearchResult
	for rows.Next() {
		var user models.SearchResult
		if err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Nickname); err != nil {
			continue // optionally log
		}
		results = append(results, user)
	}

	return results, nil
}

func (r *SqliteProfileRepo) TogglePrivacy(userID int, isPrivate bool) error {
	_, err := r.db.Exec(`UPDATE users SET is_private = ? WHERE id = ?`, isPrivate, userID)
	return err
}

// UpdateProfile updates a user's profile fields
func (r *SqliteProfileRepo) UpdateProfile(userID int, req models.UpdateProfileRequest) error {
	if req.Avatar != "" {
		_, err := r.db.Exec(
			`UPDATE users SET first_name = ?, last_name = ?, nickname = ?, about = ?, city = ?, date_of_birth = ?, avatar = ? WHERE id = ?`,
			req.FirstName, req.LastName, req.Nickname, req.About, req.City, req.DateOfBirth, req.Avatar, userID,
		)
		return err
	}

	_, err := r.db.Exec(
		`UPDATE users SET first_name = ?, last_name = ?, nickname = ?, about = ?, city = ?, date_of_birth = ? WHERE id = ?`,
		req.FirstName, req.LastName, req.Nickname, req.About, req.City, req.DateOfBirth, userID,
	)
	return err
}

// GetAllUsers returns all users for admin panel
func (r *SqliteProfileRepo) GetAllUsers() ([]models.AdminUser, error) {
	rows, err := r.db.Query(`
		SELECT id, email, first_name, last_name, nickname, avatar, city, 
		       COALESCE(role, 'user') as role, COALESCE(is_private, 0) as is_private,
		       COALESCE(is_banned, 0) as is_banned,
		       COALESCE(created_at, datetime('now')) as created_at
		FROM users
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.AdminUser
	for rows.Next() {
		var user models.AdminUser
		if err := rows.Scan(&user.ID, &user.Email, &user.FirstName, &user.LastName,
			&user.Nickname, &user.Avatar, &user.City, &user.Role, &user.IsPrivate, &user.IsBanned, &user.CreatedAt); err != nil {
			continue
		}
		users = append(users, user)
	}
	return users, nil
}

// UpdateUserRole updates a user's role
func (r *SqliteProfileRepo) UpdateUserRole(userID int, role string) error {
	_, err := r.db.Exec(`UPDATE users SET role = ? WHERE id = ?`, role, userID)
	return err
}

// DeleteUser deletes a user by ID
func (r *SqliteProfileRepo) DeleteUser(userID int) error {
	_, err := r.db.Exec(`DELETE FROM users WHERE id = ?`, userID)
	return err
}

// BanUser bans a user
func (r *SqliteProfileRepo) BanUser(userID int) error {
	_, err := r.db.Exec(`UPDATE users SET is_banned = 1 WHERE id = ?`, userID)
	return err
}

// UnbanUser unbans a user
func (r *SqliteProfileRepo) UnbanUser(userID int) error {
	_, err := r.db.Exec(`UPDATE users SET is_banned = 0 WHERE id = ?`, userID)
	return err
}
