package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"social/hub"
	"social/models"
	"social/services"
	"social/utils"
	"time"
)

type Handler struct {
	authService    *services.AuthService
	sessionService *services.SessionService
	Hub            *hub.Hub
}

type loginResponse struct {
	Token     string       `json:"token"`
	ExpiresAt time.Time    `json:"expires_at"`
	User      responseUser `json:"user"`
}

type responseUser struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
}

func NewHandler(service *services.AuthService, sessionService *services.SessionService, hub *hub.Hub) *Handler {
	return &Handler{authService: service, sessionService: sessionService, Hub: hub}
}

// handler/auth_handler.go
func (h *Handler) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// err := r.ParseMultipartForm(10 << 20) // 10 MB
	// if err != nil {
	// 	http.Error(w, "Error parsing form", http.StatusBadRequest)
	// 	return
	// }

	form := models.RegisterRequest{
		Email:       r.FormValue("email"),
		Password:    r.FormValue("password"),
		FirstName:   r.FormValue("first_name"),
		LastName:    r.FormValue("last_name"),
		DateOfBirth: r.FormValue("date_of_birth"),
		Nickname:    r.FormValue("nickname"),
		About:       r.FormValue("about"),
		City:        r.FormValue("city"),
	}

	// Handle avatar upload
	file, header, err := r.FormFile("avatar")
	if err == nil {
		defer file.Close()

		avatarPath := "uploads/avatars/" + header.Filename
		out, err := os.Create(avatarPath)
		if err != nil {
			http.Error(w, "Unable to save avatar", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		_, err = io.Copy(out, file)
		if err != nil {
			http.Error(w, "Failed to write avatar", http.StatusInternalServerError)
			return
		}
		form.Avatar = avatarPath
	} else {
		form.Avatar = ""
	}
	fmt.Println("Registering user:", form)
	// Delegate to service
	err = h.authService.Register(form)
	if err != nil {
		http.Error(w, "Could not register: "+err.Error(), http.StatusConflict)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("✅ Registered successfully"))
}

func (h *Handler) LoginHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("from login")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	user, err := h.authService.Login(req.Email, req.Password)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, expiration, err := h.sessionService.CreateSession(user.ID)
	if err != nil {
		http.Error(w, "Could not create token", http.StatusInternalServerError)
		return
	}

	user.Avatar = utils.PrepareAvatarURL(user.Avatar)
	resp := loginResponse{
		Token:     token,
		ExpiresAt: expiration,
		User: responseUser{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Nickname:  user.Nickname,
			Avatar:    user.Avatar,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	// Clear legacy session cookie if present
	isSecure, sameSite := utils.SessionCookieSettings(r)
	http.SetCookie(w, &http.Cookie{
		Name:     "session_id",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: sameSite,
		Secure:   isSecure,
	})

	w.Write([]byte("✅ Logged out successfully"))
}
