package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"social/hub"
	"social/models"
	"social/services"
	"social/utils"
)

type ProfileHandler struct {
	profileService *services.ProfileService
	sessionService *services.SessionService
	Hub            *hub.Hub
}

type meResponse struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	City      string `json:"city"`
	Role      string `json:"role"`
}

func NewProfileHandler(service *services.ProfileService, sessionService *services.SessionService, hub *hub.Hub) *ProfileHandler {
	return &ProfileHandler{profileService: service, sessionService: sessionService, Hub: hub}
}

func (h *ProfileHandler) ProfileHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.sessionService.GetUserIDFromSession(w, r)
	if !ok {
		http.SetCookie(w, &http.Cookie{
			Name:     "session_token",
			Value:    "",
			Path:     "/",
			MaxAge:   -1, // Expire immediately
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
			Secure:   false,
		})
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.profileService.ProfileRepo.GetByID(userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			fmt.Println("Error fetching user:", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(user)
}

func (h *ProfileHandler) GetUserByIDHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/users/")
	targetID := 0
	if idStr == "me" {
		requesterID, ok := h.sessionService.GetUserIDFromSession(w, r)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		targetID = requesterID

	} else {
		targeID, err := strconv.Atoi(idStr)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}
		targetID = targeID
	}
	targetID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	requesterID, ok := h.sessionService.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.profileService.GetUserProfile(requesterID, targetID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(user)
}

func (h *ProfileHandler) SearchUsers(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Missing search query", http.StatusBadRequest)
		return
	}

	results, err := h.profileService.SearchUsers(query)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	json.NewEncoder(w).Encode(results)
}

func (h *ProfileHandler) TogglePrivacy(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Méthode non autorisée", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.sessionService.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Utilisateur non authentifié", http.StatusUnauthorized)
		return
	}

	var req models.PrivacyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Requête invalide", http.StatusBadRequest)
		return
	}

	err := h.profileService.TogglePrivacy(userID, req.IsPrivate)
	if err != nil {
		http.Error(w, "Erreur base de données", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *ProfileHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userId, ok := h.sessionService.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Utilisateur non authentifié", http.StatusUnauthorized)
		return
	}

	user, err := h.profileService.ProfileRepo.GetByID(userId)
	if err != nil {
		http.Error(w, "Utilisateur non trouvé", http.StatusNotFound)
		return
	}

	user.Avatar = utils.PrepareAvatarURL(user.Avatar)

	resp := meResponse{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Nickname:  user.Nickname,
		Avatar:    user.Avatar,
		City:      user.City,
		Role:      user.Role,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
