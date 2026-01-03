package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"social/models"
	"social/services"
)

type BookHandler struct {
	Service *services.BookService
	Session *services.SessionService
}

func NewBookHandler(service *services.BookService, session *services.SessionService) *BookHandler {
	return &BookHandler{Service: service, Session: session}
}

func (h *BookHandler) BooksHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.GetFeedHandler(w, r)
	case http.MethodPost:
		h.CreateBookHandler(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *BookHandler) CreateBookHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	err := r.ParseMultipartForm(50 << 20) // 50 MB for multiple images
	if err != nil {
		http.Error(w, "Invalid form", http.StatusBadRequest)
		return
	}

	title := r.FormValue("title")
	author := r.FormValue("author")
	isbn := r.FormValue("isbn")
	description := r.FormValue("description")
	genre := r.FormValue("genre")
	condition := r.FormValue("condition")
	city := r.FormValue("city")

	if title == "" || author == "" || condition == "" || city == "" {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	book := models.Book{
		OwnerID:     userID,
		Title:       title,
		Author:      author,
		ISBN:        isbn,
		Description: description,
		Genre:       genre,
		Condition:   condition,
		City:        city,
		Available:   true,
	}

	bookID, err := h.Service.CreateBook(book)
	if err != nil {
		fmt.Println("Error creating book:", err)
		http.Error(w, "Failed to create book", http.StatusInternalServerError)
		return
	}

	// Create uploads/books directory if needed
	os.MkdirAll("uploads/books", os.ModePerm)

	// Handle multiple images
	files := r.MultipartForm.File["images"]
	for i, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			continue
		}
		defer file.Close()

		filename := fmt.Sprintf("%d_%d_%s", bookID, time.Now().UnixNano(), fileHeader.Filename)
		dst := fmt.Sprintf("uploads/books/%s", filename)

		outFile, err := os.Create(dst)
		if err != nil {
			continue
		}
		defer outFile.Close()

		io.Copy(outFile, file)

		imageURL := "/uploads/books/" + filename
		isPrimary := i == 0 // First image is primary
		h.Service.AddImage(bookID, imageURL, isPrimary)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"id": bookID})
}

func (h *BookHandler) GetFeedHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	books, err := h.Service.GetFeedBooksWithOwner(userID)
	if err != nil {
		fmt.Println("hna1", err)
		http.Error(w, "Failed to fetch books", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(books)
}

func (h *BookHandler) GetBookHandler(w http.ResponseWriter, r *http.Request) {
	idStr := strings.TrimPrefix(r.URL.Path, "/api/books/")
	bookID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	book, err := h.Service.GetBook(bookID)
	if err != nil {
		http.Error(w, "Book not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(book)
}

func (h *BookHandler) GetMyBooksHandler(w http.ResponseWriter, r *http.Request) {
	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	books, err := h.Service.GetUserBooksWithOwner(userID)
	if err != nil {
		fmt.Println("hna2", err)
		http.Error(w, "Failed to fetch books", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(books)
}

func (h *BookHandler) UpdateBookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	idStr := strings.TrimPrefix(r.URL.Path, "/api/books/")
	bookID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	var book models.Book
	if err := json.NewDecoder(r.Body).Decode(&book); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	book.ID = bookID
	book.OwnerID = userID

	if err := h.Service.UpdateBook(book); err != nil {
		http.Error(w, "Failed to update book", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (h *BookHandler) DeleteBookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	fmt.Println("User ID from session:", userID)

	idStr := strings.TrimPrefix(r.URL.Path, "/api/books/")
	bookID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid book ID", http.StatusBadRequest)
		return
	}

	if err := h.Service.DeleteBook(bookID); err != nil {
		http.Error(w, "Failed to delete book", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
