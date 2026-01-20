package models

type Book struct {
	ID          int       `json:"id"`
	OwnerID     int       `json:"owner_id"`
	Owner       BookOwner `json:"owner"`
	Title       string    `json:"title"`
	Author      string    `json:"author"`
	ISBN        string    `json:"isbn"`
	Description string    `json:"description"`
	Genre       string    `json:"genre"`
	Condition   string    `json:"condition"`
	City        string    `json:"city"`
	Available   bool      `json:"available"`
	Images      []string  `json:"images"`
	CreatedAt   string    `json:"created_at"`
	UpdatedAt   string    `json:"updated_at"`
}
type BookOwner struct {
	ID             int    `json:"id"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Avatar         string `json:"avatar"`
	City           string `json:"city"`
	BooksListed    int    `json:"booksListed"`
	BooksExchanged int    `json:"booksExchanged"`
}

type BookWithOwner struct {
	ID             int      `json:"id"`
	OwnerID        int      `json:"owner_id"`
	Title          string   `json:"title"`
	Author         string   `json:"author"`
	ISBN           string   `json:"isbn"`
	Description    string   `json:"description"`
	Genre          string   `json:"genre"`
	Condition      string   `json:"condition"`
	City           string   `json:"city"`
	Available      bool     `json:"available"`
	Images         []string `json:"images"`
	CreatedAt      string   `json:"created_at"`
	UpdatedAt      string   `json:"updated_at"`
	OwnerName      string   `json:"owner_name"`
	OwnerFirstName string   `json:"owner_first_name"`
	OwnerLastName  string   `json:"owner_last_name"`
	OwnerAvatar    string   `json:"owner_avatar"`
	OwnerCity      string   `json:"owner_city"`
}

type BookImage struct {
	ID        int    `json:"id"`
	BookID    int    `json:"book_id"`
	ImageURL  string `json:"image_url"`
	IsPrimary bool   `json:"is_primary"`
	Order     int    `json:"order_index"`
}

type BookSearchResult struct {
	ID     int    `json:"id"`
	Title  string `json:"title"`
	Author string `json:"author"`
	Genre  string `json:"genre"`
	City   string `json:"city"`
	Image  string `json:"image"`
}

// BookExchangeRequest represents a book exchange request with full details
type BookExchangeRequest struct {
	ID              int    `json:"id"`
	BookID          int    `json:"book_id"`
	BookTitle       string `json:"book_title"`
	BookAuthor      string `json:"book_author"`
	BookImage       string `json:"book_image"`
	OfferedBookID   int    `json:"offered_book_id"`
	OfferedTitle    string `json:"offered_title"`
	OfferedAuthor   string `json:"offered_author"`
	OfferedImage    string `json:"offered_image"`
	RequesterID     int    `json:"requester_id"`
	RequesterName   string `json:"requester_name"`
	RequesterAvatar string `json:"requester_avatar"`
	OwnerID         int    `json:"owner_id"`
	OwnerName       string `json:"owner_name"`
	OwnerAvatar     string `json:"owner_avatar"`
	Status          string `json:"status"`
	CreatedAt       string `json:"created_at"`
	IsIncoming      bool   `json:"is_incoming"` // true if current user is the book owner
}
