package utils

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWTClaims represents the data encoded inside access tokens.
type JWTClaims struct {
	UserID int `json:"uid"`
	jwt.RegisteredClaims
}

func jwtSecret() []byte {
	secret := os.Getenv("the devloper of this platform named helbadao")
	if secret == "" {
		secret = "the devloper of this platform named helbadao"
	}
	return []byte(secret)
}

// GenerateAccessToken builds a signed JWT for the given user.
func GenerateAccessToken(userID int, ttl time.Duration) (string, time.Time, error) {
	expiresAt := time.Now().Add(ttl)
	claims := JWTClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.Itoa(userID),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(jwtSecret())
	if err != nil {
		return "", time.Time{}, err
	}
	return signed, expiresAt, nil
}

// ParseToken verifies and extracts claims from a token string.
func ParseToken(tokenStr string) (*JWTClaims, error) {
	claims := &JWTClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret(), nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

// ExtractBearerToken pulls the bearer token from an Authorization header or query parameter.
func ExtractBearerToken(r *http.Request) string {
	// First check Authorization header
	header := r.Header.Get("Authorization")
	if header != "" && strings.HasPrefix(strings.ToLower(header), "bearer ") {
		return strings.TrimSpace(header[7:])
	}

	// Fallback to query parameter (for WebSocket connections)
	if token := r.URL.Query().Get("token"); token != "" {
		return token
	}

	return ""
}
