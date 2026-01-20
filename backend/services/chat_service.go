package services

import (
	"errors"

	"social/models"
	"social/repositories"
)

type ChatService struct {
	Repo *repositories.ChatRepository
}

// NewChatService creates a new ChatService with the given repository
func NewChatService(repo *repositories.ChatRepository) *ChatService {
	return &ChatService{Repo: repo}
}

func (s *ChatService) GetAllChatUsers(requesterID int) ([]models.ChatUser, error) {
	return s.Repo.GetAllUsers(requesterID)
}

func (s *ChatService) CanChat(userID, otherID int) (bool, error) {
	return s.Repo.CanUsersChat(userID, otherID)
}

func (s *ChatService) GetChatHistory(userID, otherID int) ([]models.Message, error) {
	canChat, err := s.Repo.CanUsersChat(userID, otherID)
	if err != nil {
		return nil, err
	}
	if !canChat {
		return nil, errors.New("chat not allowed: users must follow each other")
	}
	return s.Repo.GetChatHistory(userID, otherID)
}

func (s *ChatService) ProcessPrivateMessage(msg models.Message) error {
	// Check access rights
	hasAccess, err := s.Repo.CheckPrivateProfileAccess(msg.From, msg.To)
	if err != nil || !hasAccess {
		return err
	}

	// First message: make sure pair is allow-listed for future checks
	if err := s.Repo.EnsureChatPermission(msg.From, msg.To); err != nil {
		return err
	}

	// Save message
	return s.Repo.SavePrivateMessage(msg)
}

func (s *ChatService) ProcessGroupMessage(msg models.Message) error {
	// Validate group membership would go here

	// Save message
	return s.Repo.SaveGroupMessage(msg)
}

// GetUnreadMessageCount returns total unread messages for a user
func (s *ChatService) GetUnreadMessageCount(userID int) (int, error) {
	return s.Repo.GetUnreadMessageCount(userID)
}

// GetUnreadCountPerConversation returns unread message counts per sender
func (s *ChatService) GetUnreadCountPerConversation(userID int) (map[int]int, error) {
	return s.Repo.GetUnreadCountPerConversation(userID)
}

// MarkMessagesAsRead marks all messages from a sender to a user as read
func (s *ChatService) MarkMessagesAsRead(userID, senderID int) error {
	return s.Repo.MarkMessagesAsRead(userID, senderID)
}
