package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"social/models"
	"social/services"
)

type ReportHandler struct {
	Service *services.ReportService
	Session *services.SessionService
}

func NewReportHandler(service *services.ReportService, session *services.SessionService) *ReportHandler {
	return &ReportHandler{Service: service, Session: session}
}

// POST /api/report - Create a new report (authenticated users)
func (h *ReportHandler) CreateReportHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.Session.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.CreateReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	id, err := h.Service.CreateReport(userID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

// GET /api/admin/reports - Get all reports (admin only)
// GET /api/admin/reports?status=pending
func (h *ReportHandler) GetReportsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	status := r.URL.Query().Get("status")
	reports, err := h.Service.GetAllReports(status)
	if err != nil {
		http.Error(w, "Failed to get reports", http.StatusInternalServerError)
		return
	}

	if reports == nil {
		reports = []models.ReportWithDetails{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reports)
}

// GET/PUT/DELETE /api/admin/reports/{id}
func (h *ReportHandler) ReportHandler(w http.ResponseWriter, r *http.Request) {
	// Extract ID from URL path
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/reports/")
	id, err := strconv.Atoi(path)
	if err != nil {
		http.Error(w, "Invalid report ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodGet:
		h.getReport(w, id)
	case http.MethodPut:
		h.updateReport(w, r, id)
	case http.MethodDelete:
		h.deleteReport(w, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *ReportHandler) getReport(w http.ResponseWriter, id int) {
	report, err := h.Service.GetReport(id)
	if err != nil {
		http.Error(w, "Report not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

func (h *ReportHandler) updateReport(w http.ResponseWriter, r *http.Request, id int) {
	userID, err := h.Session.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req models.UpdateReportRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.Service.UpdateReport(id, userID, req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Report updated"})
}

func (h *ReportHandler) deleteReport(w http.ResponseWriter, id int) {
	if err := h.Service.DeleteReport(id); err != nil {
		http.Error(w, "Failed to delete report", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Report deleted"})
}

// GET /api/admin/users - Get all users (admin only)
func (h *ReportHandler) GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	users, err := h.Service.GetAllUsers()
	if err != nil {
		http.Error(w, "Failed to get users", http.StatusInternalServerError)
		return
	}

	if users == nil {
		users = []models.UserAdmin{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

// PUT/DELETE /api/admin/users/{id}
func (h *ReportHandler) UserHandler(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/admin/users/")
	parts := strings.Split(path, "/")
	id, err := strconv.Atoi(parts[0])
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	switch r.Method {
	case http.MethodPut:
		h.updateUserRole(w, r, id)
	case http.MethodDelete:
		h.deleteUser(w, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *ReportHandler) updateUserRole(w http.ResponseWriter, r *http.Request, id int) {
	var req struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := h.Service.SetUserRole(id, req.Role); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User role updated"})
}

func (h *ReportHandler) deleteUser(w http.ResponseWriter, id int) {
	if err := h.Service.DeleteUser(id); err != nil {
		http.Error(w, "Failed to delete user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "User deleted"})
}

// DELETE /api/admin/books/{id}
func (h *ReportHandler) DeleteBookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/admin/books/")
	id, err := strconv.Atoi(path)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	if err := h.Service.DeleteBook(id); err != nil {
		http.Error(w, "Failed to delete book", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Book deleted"})
}

// GET /api/admin/check - Check if user is admin
func (h *ReportHandler) CheckAdminHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, err := h.Session.GetUserIDFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	isAdmin, err := h.Service.IsAdmin(userID)
	if err != nil {
		http.Error(w, "Failed to check admin status", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"is_admin": isAdmin})
}
