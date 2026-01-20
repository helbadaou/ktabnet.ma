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

func (r *BookRepository) CreateExchangeRequest(bookID, offeredBookID, requesterID int) (int, bool, error) {
	// Validate target book availability and ownership
	var targetOwner int
	var targetAvailable bool
	err := r.DB.QueryRow(`SELECT owner_id, available FROM books WHERE id = ?`, bookID).Scan(&targetOwner, &targetAvailable)
	if err != nil {
		return 0, false, err
	}
	if targetOwner == requesterID {
		return 0, false, fmt.Errorf("cannot exchange with your own book")
	}
	if !targetAvailable {
		return 0, false, fmt.Errorf("target book not available")
	}

	// Validate offered book belongs to requester and is available
	var offeredOwner int
	var offeredAvailable bool
	err = r.DB.QueryRow(`SELECT owner_id, available FROM books WHERE id = ?`, offeredBookID).Scan(&offeredOwner, &offeredAvailable)
	if err != nil {
		return 0, false, err
	}
	if offeredOwner != requesterID {
		return 0, false, fmt.Errorf("offered book does not belong to requester")
	}
	if !offeredAvailable {
		return 0, false, fmt.Errorf("offered book not available")
	}

	// Avoid duplicate pending request for same pair
	var existing int
	_ = r.DB.QueryRow(`
		SELECT id FROM book_exchanges 
		WHERE book_id = ? AND offered_book_id = ? AND requester_id = ? AND status = 'pending'
	`, bookID, offeredBookID, requesterID).Scan(&existing)
	if existing != 0 {
		return existing, false, nil // Not a new request
	}

	res, err := r.DB.Exec(`
		INSERT INTO book_exchanges (book_id, offered_book_id, requester_id, status)
		VALUES (?, ?, ?, 'pending')
	`, bookID, offeredBookID, requesterID)
	if err != nil {
		return 0, false, err
	}
	id, _ := res.LastInsertId()
	return int(id), true, nil // New request created
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

// GetUserExchangeRequests returns all exchange requests for a user (both incoming and outgoing)
func (r *BookRepository) GetUserExchangeRequests(userID int) ([]models.BookExchangeRequest, error) {
	rows, err := r.DB.Query(`
		SELECT 
			e.id,
			e.book_id,
			b.title as book_title,
			b.author as book_author,
			(SELECT image_url FROM book_images WHERE book_id = b.id ORDER BY order_index LIMIT 1) as book_image,
			e.offered_book_id,
			ob.title as offered_title,
			ob.author as offered_author,
			(SELECT image_url FROM book_images WHERE book_id = ob.id ORDER BY order_index LIMIT 1) as offered_image,
			e.requester_id,
			COALESCE(ru.first_name || ' ' || ru.last_name, '') as requester_name,
			COALESCE(ru.avatar, '') as requester_avatar,
			b.owner_id,
			COALESCE(ou.first_name || ' ' || ou.last_name, '') as owner_name,
			COALESCE(ou.avatar, '') as owner_avatar,
			e.status,
			e.created_at
		FROM book_exchanges e
		JOIN books b ON e.book_id = b.id
		JOIN books ob ON e.offered_book_id = ob.id
		JOIN users ru ON e.requester_id = ru.id
		JOIN users ou ON b.owner_id = ou.id
		WHERE e.requester_id = ? OR b.owner_id = ?
		ORDER BY e.created_at DESC
	`, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.BookExchangeRequest
	for rows.Next() {
		var req models.BookExchangeRequest
		var bookImage, offeredImage sql.NullString
		if err := rows.Scan(
			&req.ID,
			&req.BookID,
			&req.BookTitle,
			&req.BookAuthor,
			&bookImage,
			&req.OfferedBookID,
			&req.OfferedTitle,
			&req.OfferedAuthor,
			&offeredImage,
			&req.RequesterID,
			&req.RequesterName,
			&req.RequesterAvatar,
			&req.OwnerID,
			&req.OwnerName,
			&req.OwnerAvatar,
			&req.Status,
			&req.CreatedAt,
		); err != nil {
			continue
		}
		if bookImage.Valid {
			req.BookImage = bookImage.String
		}
		if offeredImage.Valid {
			req.OfferedImage = offeredImage.String
		}
		req.IsIncoming = req.OwnerID == userID
		requests = append(requests, req)
	}
	return requests, nil
}

// UpdateExchangeStatus updates the status of an exchange request
func (r *BookRepository) UpdateExchangeStatus(exchangeID, userID int, status string) error {
	// Verify the user is the owner of the requested book
	var ownerID int
	err := r.DB.QueryRow(`
		SELECT b.owner_id 
		FROM book_exchanges e
		JOIN books b ON e.book_id = b.id
		WHERE e.id = ?
	`, exchangeID).Scan(&ownerID)
	if err != nil {
		return err
	}
	if ownerID != userID {
		return fmt.Errorf("unauthorized: only book owner can update exchange status")
	}

	_, err = r.DB.Exec(`UPDATE book_exchanges SET status = ? WHERE id = ?`, status, exchangeID)
	return err
}

// CancelExchangeRequest cancels an exchange request (only requester can cancel)
func (r *BookRepository) CancelExchangeRequest(exchangeID, userID int) error {
	var requesterID int
	err := r.DB.QueryRow(`SELECT requester_id FROM book_exchanges WHERE id = ?`, exchangeID).Scan(&requesterID)
	if err != nil {
		return err
	}
	if requesterID != userID {
		return fmt.Errorf("unauthorized: only requester can cancel")
	}

	_, err = r.DB.Exec(`UPDATE book_exchanges SET status = 'cancelled' WHERE id = ?`, exchangeID)
	return err
}
