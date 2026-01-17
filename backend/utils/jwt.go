package utils

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWT secret key - MUST be set via JWT_SECRET environment variable in production
var jwtSecret = []byte(getJWTSecret())

func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Generate a random secret for development
		randomSecret := make([]byte, 32)
		_, err := rand.Read(randomSecret)
		if err != nil {
			log.Fatal("Failed to generate random JWT secret:", err)
		}
		secret = base64.URLEncoding.EncodeToString(randomSecret)
		
		log.Println("⚠️  WARNING: JWT_SECRET environment variable not set. Generated random secret for this session.")
		log.Println("⚠️  Tokens will NOT be valid across server restarts or multiple instances.")
		log.Println("⚠️  For production, set JWT_SECRET environment variable to a strong random string (at least 32 characters)")
		return secret
	}
	if len(secret) < 32 {
		log.Println("⚠️  WARNING: JWT_SECRET should be at least 32 characters for security")
	}
	return secret
}

// Claims represents the JWT claims structure
type Claims struct {
	UserID int    `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

// GenerateJWT creates a new JWT token for a user
// Token expires after 7 days for better security
func GenerateJWT(userID int, email string) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 days

	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// ValidateJWT validates a JWT token and returns the claims
func ValidateJWT(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		// Validate the signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}
