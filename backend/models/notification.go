package models

type MarkNotificationSeenRequest struct {
	NotificationID int  `json:"notification_id"`
	MarkAll        bool `json:"mark_all"`
}

// Notification represents a notification sent to a user
type Notification struct {
	ID             int    `json:"id"`
	SenderID       int    `json:"sender_id"`
	SenderNickname string `json:"sender_nickname"`
	SenderAvatar   string `json:"sender_avatar,omitempty"`
	Type           string `json:"type"`
	Message        string `json:"message"`
	Seen           bool   `json:"seen"`
	CreatedAt      string `json:"created_at"`
	GroupId        int    `json:"group_id,omitempty"`
	EventId        int    `json:"event_id,omitempty"`
}

// NotificationCounts holds unread counts for notifications and messages
type NotificationCounts struct {
	Notifications int `json:"notifications"`
	Messages      int `json:"messages"`
}

// Notification types constants
const (
	NotificationTypeFollowRequest = "follow_request"
	NotificationTypeFollowAccept  = "follow_accept"
	NotificationTypeNewMessage    = "new_message"
	NotificationTypeComment       = "comment"
	NotificationTypeBookRequest   = "book_request"
	NotificationTypeBookAccepted  = "book_accepted"
	NotificationTypeLike          = "like"
)

// CreateNotificationRequest for generic notification creation
type CreateNotificationRequest struct {
	UserID   int    `json:"user_id"`
	SenderID int    `json:"sender_id"`
	Type     string `json:"type"`
	Message  string `json:"message"`
	GroupID  int    `json:"group_id,omitempty"`
	EventID  int    `json:"event_id,omitempty"`
}
