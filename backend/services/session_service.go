package services

import (
	"context"
	"net/http"
	"social/repositories"
	"social/utils"
	"time"
)

type contextKey string

const userIDContextKey contextKey = "userID"

type SessionService struct {
	sessionRepo *repositories.SessionRepo
	accessTTL   time.Duration
}

func NewSessionService(sessionRepo *repositories.SessionRepo) *SessionService {
	return &SessionService{
		sessionRepo: sessionRepo,
		accessTTL:   24 * time.Hour,
	}
}

func (s *SessionService) GetUserIDFromSession(w http.ResponseWriter, r *http.Request) (int, bool) {
	if ctxID, ok := userIDFromContext(r.Context()); ok {
		return ctxID, true
	}

	token := utils.ExtractBearerToken(r)
	if token == "" {
		if cookie, err := r.Cookie("session_id"); err == nil {
			token = cookie.Value
		}
	}

	if token == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return 0, false
	}

	claims, err := utils.ParseToken(token)
	if err != nil {
		http.SetCookie(w, &http.Cookie{
			Name:     "session_id",
			Value:    "",
			Path:     "/",
			MaxAge:   -1,
			HttpOnly: true,
		})
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return 0, false
	}

	return claims.UserID, true
}

func userIDFromContext(ctx context.Context) (int, bool) {
	val := ctx.Value(userIDContextKey)
	if val == nil {
		return 0, false
	}
	id, ok := val.(int)
	return id, ok
}

func withUserID(ctx context.Context, userID int) context.Context {
	return context.WithValue(ctx, userIDContextKey, userID)
}

// Middleware enforces JWT auth and stores the user ID in the request context.
func (s *SessionService) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			next.ServeHTTP(w, r)
			return
		}

		userID, ok := s.GetUserIDFromSession(w, r)
		if !ok {
			return
		}

		ctx := withUserID(r.Context(), userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func (s *SessionService) GetUserNicknameById(userId int) string {
	return s.sessionRepo.GetUserNicknameById(userId)
}

func (s *SessionService) CreateSession(userID int) (string, time.Time, error) {
	return utils.GenerateAccessToken(userID, s.accessTTL)
}

// GetUserIDFromRequest extracts user ID from the request context or token
func (s *SessionService) GetUserIDFromRequest(r *http.Request) (int, error) {
	if ctxID, ok := userIDFromContext(r.Context()); ok {
		return ctxID, nil
	}

	token := utils.ExtractBearerToken(r)
	if token == "" {
		if cookie, err := r.Cookie("session_id"); err == nil {
			token = cookie.Value
		}
	}

	if token == "" {
		return 0, http.ErrNoCookie
	}

	claims, err := utils.ParseToken(token)
	if err != nil {
		return 0, err
	}

	return claims.UserID, nil
}
