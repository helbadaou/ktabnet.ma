package services

import (
	"fmt"
	"net/http"
	"social/db/sqlite"
	"social/repositories"
	"social/utils"
	"time"
)

type SessionService struct {
	sessionRepo *repositories.SessionRepo
}

func NewSessionService(sessionRepo *repositories.SessionRepo) *SessionService {
	return &SessionService{sessionRepo: sessionRepo}
}

func (s *SessionService) GetUserIDFromSession(w http.ResponseWriter, r *http.Request) (int, bool) {
	id, err := s.sessionRepo.ValidateSession(r, sqlite.DB)
	if err != nil {
		fmt.Println("Error validating session:", err)
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
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return 0, false
	}
	return id, true
}

func (s *SessionService) GetUserNicknameById(userId int) string {
	return s.sessionRepo.GetUserNicknameById(userId)
}

func (s *SessionService) CreateSession(userID int) (string, time.Time, error) {
	return s.sessionRepo.CreateSession(userID)
}
