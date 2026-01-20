package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"social/services"
	"strconv"
)

type ChatHandler struct {
	Service *services.ChatService
	Session *services.SessionService // For getting user ID from session
}

// NewChatHandler creates a new ChatHandler instance
func NewChatHandler(chatService *services.ChatService, sessionService *services.SessionService) *ChatHandler {
	return &ChatHandler{
		Service: chatService,
		Session: sessionService,
	}
}

func (h *ChatHandler) GetAllChatUsers(w http.ResponseWriter, r *http.Request) {
	requesterID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	users, err := h.Service.GetAllChatUsers(requesterID)
	if err != nil {
		fmt.Println("hhhhh", err)
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(users)
}

func (h *ChatHandler) GetChatHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	otherIDStr := r.URL.Query().Get("with")
	if otherIDStr == "" {
		http.Error(w, "Missing 'with' parameter", http.StatusBadRequest)
		return
	}

	otherID, err := strconv.Atoi(otherIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Mark messages as read when opening a conversation
	_ = h.Service.MarkMessagesAsRead(userID, otherID)

	messages, err := h.Service.GetChatHistory(userID, otherID)
	if err != nil {
		if err.Error() == "chat not allowed: users must follow each other" {
			http.Error(w, err.Error(), http.StatusForbidden)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(messages)
}

// GetUnreadMessageCount returns the total count of unread messages
func (h *ChatHandler) GetUnreadMessageCount(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	count, err := h.Service.GetUnreadMessageCount(userID)
	if err != nil {
		count = 0
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]int{"count": count})
}

// GetUnreadCountPerConversation returns unread message counts per conversation
func (h *ChatHandler) GetUnreadCountPerConversation(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	counts, err := h.Service.GetUnreadCountPerConversation(userID)
	if err != nil {
		counts = make(map[int]int)
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(counts)
}

// MarkMessagesAsRead marks all messages from a specific sender as read
func (h *ChatHandler) MarkMessagesAsRead(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		SenderID int `json:"sender_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err := h.Service.MarkMessagesAsRead(userID, req.SenderID)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
