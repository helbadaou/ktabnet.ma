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
