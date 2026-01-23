package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"social/services"
)

type AdminHandler struct {
	profileService *services.ProfileService
	sessionService *services.SessionService
	bookService    *services.BookService
}

func NewAdminHandler(profileService *services.ProfileService, sessionService *services.SessionService, bookService *services.BookService) *AdminHandler {
	return &AdminHandler{
		profileService: profileService,
		sessionService: sessionService,
		bookService:    bookService,
	}
}

// AdminOnly middleware checks if user is admin or moderator
func (h *AdminHandler) AdminOnly(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := h.sessionService.GetUserIDFromSession(w, r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := h.profileService.ProfileRepo.GetByID(userID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if user.Role != "admin" && user.Role != "moderator" {
			http.Error(w, "Forbidden: Admin access required", http.StatusForbidden)
			return
		}

		next(w, r)
	}
}

// AdminOnlyStrict - only full admin access
func (h *AdminHandler) AdminOnlyStrict(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := h.sessionService.GetUserIDFromSession(w, r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		user, err := h.profileService.ProfileRepo.GetByID(userID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if user.Role != "admin" {
			http.Error(w, "Forbidden: Full admin access required", http.StatusForbidden)
			return
		}

		next(w, r)
	}
}

type AdminUserResponse struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	City      string `json:"city"`
	Role      string `json:"role"`
	IsPrivate bool   `json:"is_private"`
	CreatedAt string `json:"created_at"`
}

// GetAllUsers returns all users for admin panel
func (h *AdminHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	users, err := h.profileService.ProfileRepo.GetAllUsers()
	if err != nil {
		fmt.Println("Error fetching users:", err)
		http.Error(w, "Failed to fetch users", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

type UpdateRoleRequest struct {
	Role string `json:"role"`
}

// UserHandler handles PUT (update role) and DELETE (delete user) for /api/admin/users/{id}
func (h *AdminHandler) UserHandler(w http.ResponseWriter, r *http.Request) {
	// Route ban/unban requests to dedicated handler
	if strings.HasSuffix(r.URL.Path, "/ban") {
		h.BanUserHandler(w, r)
		return
	}

	switch r.Method {
	case http.MethodPut:
		h.updateUserRole(w, r)
	case http.MethodDelete:
		h.deleteUser(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// updateUserRole updates a user's role (admin only)
func (h *AdminHandler) updateUserRole(w http.ResponseWriter, r *http.Request) {

	// Get current admin user
	adminUserID, ok := h.sessionService.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	adminUser, err := h.profileService.ProfileRepo.GetByID(adminUserID)
	if err != nil || adminUser.Role != "admin" {
		http.Error(w, "Only admins can change roles", http.StatusForbidden)
		return
	}

	// Get user ID from URL
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	userID, err := strconv.Atoi(path)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Can't change own role
	if userID == adminUserID {
		http.Error(w, "Cannot change your own role", http.StatusBadRequest)
		return
	}

	// Protect the first admin (super admin) - user ID 1 cannot be modified by anyone
	if userID == 1 {
		http.Error(w, "Cannot modify the super admin", http.StatusForbidden)
		return
	}

	// Check if target user is an admin - only super admin (ID 1) can modify other admins
	targetUser, err := h.profileService.ProfileRepo.GetByID(userID)
	if err == nil && targetUser.Role == "admin" && adminUserID != 1 {
		http.Error(w, "Only the super admin can modify other admins", http.StatusForbidden)
		return
	}

	var req UpdateRoleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate role
	validRoles := map[string]bool{"user": true, "moderator": true, "admin": true}
	if !validRoles[req.Role] {
		http.Error(w, "Invalid role. Must be 'user', 'moderator', or 'admin'", http.StatusBadRequest)
		return
	}

	err = h.profileService.ProfileRepo.UpdateUserRole(userID, req.Role)
	if err != nil {
		fmt.Println("Error updating role:", err)
		http.Error(w, "Failed to update role", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Role updated successfully"})
}

// deleteUser deletes a user (admin only)
func (h *AdminHandler) deleteUser(w http.ResponseWriter, r *http.Request) {

	// Get current admin user
	adminUserID, ok := h.sessionService.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	adminUser, err := h.profileService.ProfileRepo.GetByID(adminUserID)
	if err != nil || adminUser.Role != "admin" {
		http.Error(w, "Only admins can delete users", http.StatusForbidden)
		return
	}

	// Get user ID from URL
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	userID, err := strconv.Atoi(path)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Can't delete self
	if userID == adminUserID {
		http.Error(w, "Cannot delete yourself", http.StatusBadRequest)
		return
	}

	// Protect the first admin (super admin) - user ID 1 cannot be deleted
	if userID == 1 {
		http.Error(w, "Cannot delete the super admin", http.StatusForbidden)
		return
	}

	// Check if target user is an admin - only super admin (ID 1) can delete other admins
	targetUser, err := h.profileService.ProfileRepo.GetByID(userID)
	if err == nil && targetUser.Role == "admin" && adminUserID != 1 {
		http.Error(w, "Only the super admin can delete other admins", http.StatusForbidden)
		return
	}

	err = h.profileService.ProfileRepo.DeleteUser(userID)
	if err != nil {
		fmt.Println("Error deleting user:", err)
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted successfully"})
}

// DeleteBook deletes a book (admin or moderator)
func (h *AdminHandler) DeleteBook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get book ID from URL
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/books/")
	bookID, err := strconv.Atoi(path)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	err = h.bookService.DeleteBook(bookID)
	if err != nil {
		fmt.Println("Error deleting book:", err)
		http.Error(w, "Failed to delete book", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Book deleted successfully"})
}

// BanUserHandler handles banning/unbanning users
func (h *AdminHandler) BanUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get current admin user
	adminUserID, ok := h.sessionService.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	adminUser, err := h.profileService.ProfileRepo.GetByID(adminUserID)
	if err != nil || adminUser.Role != "admin" {
		http.Error(w, "Only admins can ban users", http.StatusForbidden)
		return
	}

	// Get user ID from URL
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	path = strings.TrimSuffix(path, "/ban")
	userID, err := strconv.Atoi(path)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Can't ban self
	if userID == adminUserID {
		http.Error(w, "Cannot ban yourself", http.StatusBadRequest)
		return
	}

	// Protect the first admin (super admin) - user ID 1 cannot be banned
	if userID == 1 {
		http.Error(w, "Cannot ban the super admin", http.StatusForbidden)
		return
	}

	// Check if target user is an admin - only super admin (ID 1) can ban other admins
	targetUser, err := h.profileService.ProfileRepo.GetByID(userID)
	if err == nil && targetUser.Role == "admin" && adminUserID != 1 {
		http.Error(w, "Only the super admin can ban other admins", http.StatusForbidden)
		return
	}

	var req struct {
		IsBanned bool `json:"is_banned"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.IsBanned {
		err = h.profileService.BanUser(userID)
	} else {
		err = h.profileService.UnbanUser(userID)
	}

	if err != nil {
		fmt.Println("Error banning/unbanning user:", err)
		http.Error(w, "Failed to update ban status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Ban status updated successfully"})
}
