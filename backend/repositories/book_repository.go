package repositories

import (
	"database/sql"
	"fmt"
	"strings"

	"social/models"
)

type BookRepository struct {
	DB *sql.DB
}

func NewBookRepository(db *sql.DB) *BookRepository {
	return &BookRepository{DB: db}
}

func (r *BookRepository) CreateBook(book models.Book) (int, error) {
	result, err := r.DB.Exec(`
		INSERT INTO books (owner_id, title, author, isbn, description, genre, condition, city, available)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, book.OwnerID, book.Title, book.Author, book.ISBN, book.Description, book.Genre, book.Condition, book.City, book.Available)
	if err != nil {
		return 0, err
	}
	id, err := result.LastInsertId()
	fmt.Println("hhhhhh", err)
	return int(id), err
}

func (r *BookRepository) GetBookByID(bookID int) (models.Book, error) {
	var book models.Book
	err := r.DB.QueryRow(`
		SELECT id, owner_id, title, author, isbn, description, genre, condition, city, available, created_at, updated_at
		FROM books WHERE id = ?
	`, bookID).Scan(&book.ID, &book.OwnerID, &book.Title, &book.Author, &book.ISBN, &book.Description, &book.Genre, &book.Condition, &book.City, &book.Available, &book.CreatedAt, &book.UpdatedAt)
	if err != nil {
		return book, err
	}

	// Fetch images
	rows, err := r.DB.Query(`
		SELECT image_url FROM book_images WHERE book_id = ? ORDER BY order_index
	`, bookID)
	if err != nil {
		return book, nil
	}
	defer rows.Close()

	var images []string
	for rows.Next() {
		var url string
		if err := rows.Scan(&url); err == nil {
			images = append(images, url)
		}
	}
	book.Images = images
	err = r.DB.QueryRow(`
	SELECT id, first_name, last_name, avatar
	FROM users
	WHERE id = ?
`, book.OwnerID).Scan(
		&book.Owner.ID,
		&book.Owner.FirstName,
		&book.Owner.LastName,
		&book.Owner.Avatar,
	)
	if err != nil {
		return book, err
	}

	return book, nil
}

func (r *BookRepository) GetUserBooks(userID int) ([]models.Book, error) {
	rows, err := r.DB.Query(`
		SELECT id, owner_id, title, author, isbn, description, genre, condition, city, available, created_at, updated_at
		FROM books WHERE owner_id = ? ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []models.Book
	for rows.Next() {
		var book models.Book
		if err := rows.Scan(&book.ID, &book.OwnerID, &book.Title, &book.Author, &book.ISBN, &book.Description, &book.Genre, &book.Condition, &book.City, &book.Available, &book.CreatedAt, &book.UpdatedAt); err == nil {
			// Fetch images for this book
			imgRows, _ := r.DB.Query(`
				SELECT image_url FROM book_images WHERE book_id = ? ORDER BY order_index
			`, book.ID)
			var images []string
			for imgRows.Next() {
				var url string
				if err := imgRows.Scan(&url); err == nil {
					images = append(images, url)
				}
			}
			imgRows.Close()
			book.Images = images
			books = append(books, book)
		}
	}
	return books, nil
}

func (r *BookRepository) GetAllBooks(excludeUserID int) ([]models.Book, error) {
	rows, err := r.DB.Query(`
		SELECT id, owner_id, title, author, isbn, description, genre, condition, city, available, created_at, updated_at
		FROM books WHERE available = 1 AND owner_id != ? ORDER BY created_at DESC
	`, excludeUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []models.Book
	for rows.Next() {
		var book models.Book
		if err := rows.Scan(&book.ID, &book.OwnerID, &book.Title, &book.Author, &book.ISBN, &book.Description, &book.Genre, &book.Condition, &book.City, &book.Available, &book.CreatedAt, &book.UpdatedAt); err == nil {
			imgRows, _ := r.DB.Query(`
				SELECT image_url FROM book_images WHERE book_id = ? ORDER BY order_index
			`, book.ID)
			var images []string
			for imgRows.Next() {
				var url string
				if err := imgRows.Scan(&url); err == nil {
					images = append(images, url)
				}
			}
			imgRows.Close()
			book.Images = images
			books = append(books, book)
		}
	}
	return books, nil
}

func (r *BookRepository) GetAllBooksWithOwner(excludeUserID int) ([]models.BookWithOwner, error) {
	rows, err := r.DB.Query(`
		SELECT b.id, b.owner_id, b.title, b.author, b.isbn, b.description, b.genre, b.condition, b.city, b.available, b.created_at, b.updated_at,
		       COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as owner_name,
		       COALESCE(u.first_name, ''), COALESCE(u.last_name, ''),
		       COALESCE(u.avatar, ''), COALESCE(b.city, 'Unknown')
		FROM books b
		LEFT JOIN users u ON b.owner_id = u.id
		WHERE b.available = 1 AND b.owner_id != ? ORDER BY b.created_at DESC
	`, excludeUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []models.BookWithOwner
	for rows.Next() {
		var book models.BookWithOwner
		if err := rows.Scan(&book.ID, &book.OwnerID, &book.Title, &book.Author, &book.ISBN, &book.Description, &book.Genre, &book.Condition, &book.City, &book.Available, &book.CreatedAt, &book.UpdatedAt, &book.OwnerName, &book.OwnerFirstName, &book.OwnerLastName, &book.OwnerAvatar, &book.OwnerCity); err == nil {
			imgRows, _ := r.DB.Query(`
				SELECT image_url FROM book_images WHERE book_id = ? ORDER BY order_index
			`, book.ID)
			var images []string
			for imgRows.Next() {
				var url string
				if err := imgRows.Scan(&url); err == nil {
					images = append(images, url)
				}
			}
			imgRows.Close()
			book.Images = images
			books = append(books, book)
		}
	}
	return books, nil
}

func (r *BookRepository) GetUserBooksWithOwner(userID int) ([]models.BookWithOwner, error) {
	rows, err := r.DB.Query(`
		SELECT b.id, b.owner_id, b.title, b.author, b.isbn, b.description, b.genre, b.condition, b.city, b.available, b.created_at, b.updated_at,
		       COALESCE(u.first_name || ' ' || u.last_name, 'Unknown') as owner_name,
		       COALESCE(u.first_name, ''), COALESCE(u.last_name, ''),
		       COALESCE(u.avatar, ''), COALESCE(b.city, 'Unknown')
		FROM books b
		LEFT JOIN users u ON b.owner_id = u.id
		WHERE b.owner_id = ? ORDER BY b.created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var books []models.BookWithOwner
	for rows.Next() {
		var book models.BookWithOwner
		if err := rows.Scan(&book.ID, &book.OwnerID, &book.Title, &book.Author, &book.ISBN, &book.Description, &book.Genre, &book.Condition, &book.City, &book.Available, &book.CreatedAt, &book.UpdatedAt, &book.OwnerName, &book.OwnerFirstName, &book.OwnerLastName, &book.OwnerAvatar, &book.OwnerCity); err == nil {
			imgRows, _ := r.DB.Query(`
				SELECT image_url FROM book_images WHERE book_id = ? ORDER BY order_index
			`, book.ID)
			var images []string
			for imgRows.Next() {
				var url string
				if err := imgRows.Scan(&url); err == nil {
					images = append(images, url)
				}
			}
			imgRows.Close()
			book.Images = images
			books = append(books, book)
		}
	}
	return books, nil
}

func (r *BookRepository) UpdateBook(book models.Book) error {
	_, err := r.DB.Exec(`
		UPDATE books SET title = ?, author = ?, isbn = ?, description = ?, genre = ?, condition = ?, available = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`, book.Title, book.Author, book.ISBN, book.Description, book.Genre, book.Condition, book.Available, book.ID)
	return err
}

func (r *BookRepository) DeleteBook(bookID int) error {
	_, err := r.DB.Exec(`DELETE FROM books WHERE id = ?`, bookID)
	return err
}

func (r *BookRepository) AddImage(bookID int, imageURL string, isPrimary bool) error {
	_, err := r.DB.Exec(`
		INSERT INTO book_images (book_id, image_url, is_primary, order_index)
		VALUES (?, ?, ?, (SELECT COALESCE(MAX(order_index), -1) + 1 FROM book_images WHERE book_id = ?))
	`, bookID, imageURL, isPrimary, bookID)
	return err
}

func (r *BookRepository) RemoveImage(imageID int) error {
	_, err := r.DB.Exec(`DELETE FROM book_images WHERE id = ?`, imageID)
	return err
}

func (r *BookRepository) SearchBooks(query string) ([]models.BookSearchResult, error) {
	search := "%" + strings.ToLower(query) + "%"
	rows, err := r.DB.Query(`
		SELECT b.id, b.title, b.author, b.genre, b.city,
		       (SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY order_index LIMIT 1) as image
		FROM books b
		WHERE b.available = 1 AND (LOWER(b.title) LIKE ? OR LOWER(b.author) LIKE ?)
		ORDER BY b.created_at DESC
		LIMIT 10
	`, search, search)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.BookSearchResult
	for rows.Next() {
		var book models.BookSearchResult
		var image sql.NullString
		if err := rows.Scan(&book.ID, &book.Title, &book.Author, &book.Genre, &book.City, &image); err != nil {
			continue
		}
		if image.Valid {
			book.Image = image.String
		}
		results = append(results, book)
	}
	return results, nil
}
