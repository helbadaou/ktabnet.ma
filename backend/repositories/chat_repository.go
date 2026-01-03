package repositories

import (
	"database/sql"
	"errors"
	"social/models"
	"time"
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
		SELECT DISTINCT u.id, u.first_name, u.last_name, u.avatar, u.is_private
		FROM users u
		JOIN (
			SELECT from_id AS user_id FROM messages WHERE to_id = ?
			UNION
			SELECT to_id AS user_id FROM messages WHERE from_id = ?
		) AS conversations ON u.id = conversations.user_id
		WHERE u.id != ?
	`, requesterID, requesterID, requesterID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []models.ChatUser

	for rows.Next() {
		var id int
		var firstName, lastName, avatar string
		var isPrivate bool

		if err := rows.Scan(&id, &firstName, &lastName, &avatar, &isPrivate); err != nil {
			continue
		}

		fullName := firstName + " " + lastName
		user := models.ChatUser{
			ID:        id,
			FullName:  fullName,
			Avatar:    avatar,
			IsPrivate: isPrivate,
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
	// Vérifier si user1 suit user2 ET user2 suit user1 (suivi mutuel)
	var count int
	err := r.DB.QueryRow(`
		SELECT COUNT(*) FROM followers 
		WHERE (follower_id = ? AND followed_id = ? AND status = 'accepted')
		OR EXISTS (
			SELECT 1 FROM followers 
			WHERE follower_id = ? AND followed_id = ? AND status = 'accepted'
		)
	`, userID1, userID2, userID2, userID1).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
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

func (r *ChatRepository) SaveGroupMessage(msg models.Message) error {
	_, err := r.DB.Exec(`
		INSERT INTO group_messages (group_id, sender_id, content, timestamp)
		VALUES (?, ?, ?, ?)
	`, msg.GroupID, msg.From, msg.Content, time.Now())
	return err
}



func (r *ChatRepository) CheckPrivateProfileAccess(senderID, recipientID int) (bool, error) {
	if senderID == recipientID {
		return true, nil
	}

	var isPrivate bool
	err := r.DB.QueryRow(`
		SELECT is_private FROM users WHERE id = ?
	`, recipientID).Scan(&isPrivate)
	if err != nil {
		return false, err
	}

	if !isPrivate {
		return true, nil
	}

	var status string
	err = r.DB.QueryRow(`
		SELECT status FROM followers 
		WHERE follower_id = ? AND followed_id = ? AND status = 'accepted'
	`, senderID, recipientID).Scan(&status)

	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	return status == "accepted", nil
}
