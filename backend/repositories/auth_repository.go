package repositories

import (
	"database/sql"
	"errors"
	"fmt"
	"social/models"
)

type SqliteUserRepo struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *SqliteUserRepo {
	return &SqliteUserRepo{db: db}
}

func (r *SqliteUserRepo) FindUserWithPasswordByEmail(email string) (*models.User, string, error) {
	var user models.User
	var hashedPassword string

	query := `SELECT id, password, email, first_name, last_name, date_of_birth, nickname, about, avatar, city, COALESCE(role, 'user') as role, COALESCE(is_banned, 0) as is_banned FROM users WHERE email = ?`
	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &hashedPassword,
		&user.Email, &user.FirstName, &user.LastName,
		&user.DateOfBirth, &user.Nickname, &user.About, &user.Avatar,
		&user.City, &user.Role, &user.IsBanned,
	)
	if err != nil {
		return nil, "", errors.New("user not found")
	}
	return &user, hashedPassword, nil
}

// repository/user_repository.go
// GetUserCount returns the total number of users in the database
func (r *SqliteUserRepo) GetUserCount() (int, error) {
	var count int
	err := r.db.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	return count, err
}

func (r *SqliteUserRepo) CreateUser(user *models.User) error {
	query := `
	INSERT INTO users (email, password, first_name, last_name, date_of_birth, nickname, about, avatar, city, role)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.Exec(query,
		user.Email,
		user.Password,
		user.FirstName,
		user.LastName,
		user.DateOfBirth,
		user.Nickname,
		user.About,
		user.Avatar,
		user.City,
		user.Role,
	)
	fmt.Println("Creating user:", err)
	return err
}
