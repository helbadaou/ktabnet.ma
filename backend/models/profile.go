package models

type Profile struct {
	ID          int    `json:"id"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Nickname    string `json:"nickname"`
	Email       string `json:"email"`
	About       string `json:"about"`
	Avatar      string `json:"avatar"`
	City        string `json:"city"`
	DateOfBirth string `json:"date_of_birth"`
	IsPrivate   bool   `json:"is_private"`

	// Meta info (not stored in DB)
	IsOwner    bool `json:"is_owner"`
	IsFollowed bool `json:"is_followed"`
	IsPending  bool `json:"is_pending"`
}

type SearchResult struct {
	ID        int    `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
}

type AdminUser struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
	Avatar    string `json:"avatar"`
	City      string `json:"city"`
	Role      string `json:"role"`
	IsPrivate bool   `json:"is_private"`
	IsBanned  bool   `json:"is_banned"`
	CreatedAt string `json:"created_at"`
}

type PrivacyRequest struct {
	IsPrivate bool `json:"is_private"`
}

type UpdateProfileRequest struct {
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Nickname    string `json:"nickname"`
	About       string `json:"about"`
	City        string `json:"city"`
	DateOfBirth string `json:"date_of_birth"`
	Avatar      string `json:"avatar"`
}
