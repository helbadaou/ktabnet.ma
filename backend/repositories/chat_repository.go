package repositories

import (
	"database/sql"
	"time"

	"social/models"
)

type ChatRepository struct {
	DB *sql.DB
}

// NewChatRepository creates a new ChatRepository with the given DB connection
func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{DB: db}
}

// GetAllUsers returns all users that the requester has had a conversation with.
func (r *ChatRepository) GetAllUsers(requesterID int) ([]models.ChatUser, error) {
	rows, err := r.DB.Query(`
		WITH related AS (
			-- Any user we have a chat permission with (store pairs once with user_a < user_b)
			SELECT CASE WHEN cp.user_a_id = ? THEN cp.user_b_id ELSE cp.user_a_id END AS user_id
			FROM chat_permissions cp
			WHERE cp.user_a_id = ? OR cp.user_b_id = ?
			UNION
			-- Any user we have exchanged messages with
			SELECT from_id AS user_id FROM messages WHERE to_id = ?
			UNION
			SELECT to_id AS user_id FROM messages WHERE from_id = ?
		)
		SELECT DISTINCT u.id, u.first_name, u.last_name, u.avatar
		FROM users u
		JOIN related r ON u.id = r.user_id
		WHERE u.id != ?
	`, requesterID, requesterID, requesterID, requesterID, requesterID, requesterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.ChatUser

	for rows.Next() {
		var id int
		var firstName, lastName, avatar string

		if err := rows.Scan(&id, &firstName, &lastName, &avatar); err != nil {
			continue
		}

		fullName := firstName + " " + lastName
		user := models.ChatUser{
			ID:       id,
			FullName: fullName,
			Avatar:   avatar,
		}

		// Fetch follow status if not self
		if id != requesterID {
			var status string
			err := r.DB.QueryRow(`SELECT status FROM followers WHERE follower_id = ? AND followed_id = ?`, requesterID, id).Scan(&status)
			if err == nil {
				user.FollowStatus = status
			} else {
				user.FollowStatus = ""
			}
		}

		users = append(users, user)
	}

	return users, nil
}

func (r *ChatRepository) CanUsersChat(userID1, userID2 int) (bool, error) {
	if userID1 == userID2 {
		return false, nil
	}

	// Explicit allow-list takes precedence (store pairs once with user_a_id < user_b_id)
	var allowed int
	err := r.DB.QueryRow(`
		SELECT COUNT(*) FROM chat_permissions
		WHERE (user_a_id = ? AND user_b_id = ?)
		   OR (user_a_id = ? AND user_b_id = ?)
	`, userID1, userID2, userID2, userID1).Scan(&allowed)
	if err != nil {
		return false, err
	}
	if allowed > 0 {
		return true, nil
	}

	// Fallback: both users must follow each other (mutual acceptance)
	var mutual int
	err = r.DB.QueryRow(`
		SELECT COUNT(*)
		FROM followers f1
		JOIN followers f2 ON f1.follower_id = ? AND f1.followed_id = ? AND f2.follower_id = ? AND f2.followed_id = ?
		WHERE f1.status = 'accepted' AND f2.status = 'accepted'
	`, userID1, userID2, userID2, userID1).Scan(&mutual)
	if err != nil {
		return false, err
	}

	return mutual > 0, nil
}

func (r *ChatRepository) GetChatHistory(userID, otherID int) ([]models.Message, error) {
	rows, err := r.DB.Query(`
		SELECT from_id, to_id, content, type, timestamp
		FROM messages
		WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)
		ORDER BY timestamp ASC
	`, userID, otherID, otherID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		var ts string
		if err := rows.Scan(&msg.From, &msg.To, &msg.Content, &msg.Type, &ts); err != nil {
			continue
		}
		// Parse timestamp string to time.Time
		t, err := time.Parse(time.RFC3339, ts)
		if err != nil {
			t = time.Time{}
		}
		msg.Timestamp = t.Format(time.RFC3339)
		messages = append(messages, msg)
	}
	return messages, nil
}

func (r *ChatRepository) SavePrivateMessage(msg models.Message) error {
	_, err := r.DB.Exec(`
		INSERT INTO messages (from_id, to_id, content, type, timestamp)
		VALUES (?, ?, ?, ?, ?)
	`, msg.From, msg.To, msg.Content, "private", time.Now())
	return err
}

// EnsureChatPermission stores an allow-list entry for the pair (order-independent).
func (r *ChatRepository) EnsureChatPermission(userID1, userID2 int) error {
	if userID1 == userID2 {
		return nil
	}
	a, b := userID1, userID2
	if a > b {
		a, b = b, a
	}
	_, err := r.DB.Exec(`
		INSERT OR IGNORE INTO chat_permissions (user_a_id, user_b_id)
		VALUES (?, ?)
	`, a, b)
	return err
}

func (r *ChatRepository) SaveGroupMessage(msg models.Message) error {
	_, err := r.DB.Exec(`
		INSERT INTO group_messages (group_id, sender_id, content, timestamp)
		VALUES (?, ?, ?, ?)
	`, msg.GroupID, msg.From, msg.Content, time.Now())
	return err
}

func (r *ChatRepository) CheckPrivateProfileAccess(senderID, recipientID int) (bool, error) {
	return true, nil
}
