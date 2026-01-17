package models

type RegisterRequest struct {
	Email       string `json:"email"`
	Password    string `json:"password"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	DateOfBirth string `json:"date_of_birth"`
	Nickname    string `json:"nickname"`
	About       string `json:"about"`
	Avatar      string `json:"avatar"`
	City        string `json:"city"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type User struct {
	ID          int
	Email       string
	Password    string
	FirstName   string
	LastName    string
	DateOfBirth string
	Nickname    string
	About       string
	Avatar      string
	City        string
}

type LoginResponse struct {
	User  User   `json:"user"`
	Token string `json:"token"`
}
