package services

import (
	"social/models"
	"social/repositories"
)

type NotificationService struct {
	Repo *repositories.NotificationRepository
}

func NewNotificationService(repo *repositories.NotificationRepository) *NotificationService {
	return &NotificationService{Repo: repo}
}

func (s *NotificationService) GetUserNotifications(userID int) ([]models.Notification, error) {
	return s.Repo.GetNotificationsByUserID(userID)
}

func (s *NotificationService) MarkNotificationsAsSeen(userID int, notificationID int, markAll bool) error {
	if markAll {
		return s.Repo.MarkAllAsSeen(userID)
	} else if notificationID > 0 {
		return s.Repo.MarkOneAsSeen(notificationID, userID)
	}
	return nil
}

// service/notification_service.go
func (s *NotificationService) DeleteNotification(userID, notificationID int) error {
	return s.Repo.DeleteNotification(userID, notificationID)
}

// CreateNotification creates a generic notification
func (s *NotificationService) CreateNotification(req models.CreateNotificationRequest) error {
	return s.Repo.CreateNotification(req)
}

// GetUnreadNotificationCount returns the count of unseen notifications
func (s *NotificationService) GetUnreadNotificationCount(userID int) (int, error) {
	return s.Repo.GetUnreadNotificationCount(userID)
}

// CreateFollowAcceptNotification creates a notification when follow request is accepted
func (s *NotificationService) CreateFollowAcceptNotification(userID, senderID int, senderName string) error {
	return s.Repo.CreateNotification(models.CreateNotificationRequest{
		UserID:   userID,
		SenderID: senderID,
		Type:     models.NotificationTypeFollowAccept,
		Message:  senderName + " accepted your follow request",
	})
}

// CreateMessageNotification creates a notification for a new message
func (s *NotificationService) CreateMessageNotification(userID, senderID int, senderName string) error {
	return s.Repo.CreateNotification(models.CreateNotificationRequest{
		UserID:   userID,
		SenderID: senderID,
		Type:     models.NotificationTypeNewMessage,
		Message:  senderName + " sent you a message",
	})
}

// CreateCommentNotification creates a notification for a new comment
func (s *NotificationService) CreateCommentNotification(userID, senderID int, senderName string) error {
	return s.Repo.CreateNotification(models.CreateNotificationRequest{
		UserID:   userID,
		SenderID: senderID,
		Type:     models.NotificationTypeComment,
		Message:  senderName + " commented on your post",
	})
}

// CreateBookRequestNotification creates a notification for a book exchange request
func (s *NotificationService) CreateBookRequestNotification(userID, senderID int, senderName, bookTitle string) error {
	return s.Repo.CreateNotification(models.CreateNotificationRequest{
		UserID:   userID,
		SenderID: senderID,
		Type:     models.NotificationTypeBookRequest,
		Message:  senderName + " wants to exchange \"" + bookTitle + "\"",
	})
}

// CreateLikeNotification creates a notification for a post like
func (s *NotificationService) CreateLikeNotification(userID, senderID int, senderName string) error {
	return s.Repo.CreateNotification(models.CreateNotificationRequest{
		UserID:   userID,
		SenderID: senderID,
		Type:     models.NotificationTypeLike,
		Message:  senderName + " liked your post",
	})
}
