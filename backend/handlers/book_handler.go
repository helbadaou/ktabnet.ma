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

	"social/hub"
	"social/models"
	"social/services"
)

type BookHandler struct {
	Service      *services.BookService
	Session      *services.SessionService
	NotifService *services.NotificationService
	Hub          *hub.Hub
}

func NewBookHandler(service *services.BookService, session *services.SessionService, notifService *services.NotificationService, hub *hub.Hub) *BookHandler {
	return &BookHandler{Service: service, Session: session, NotifService: notifService, Hub: hub}
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

type exchangeRequest struct {
	BookID        int `json:"book_id"`
	OfferedBookID int `json:"offered_book_id"`
}

func (h *BookHandler) ExchangeBookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req exchangeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	if req.BookID <= 0 || req.OfferedBookID <= 0 {
		http.Error(w, "Invalid book ids", http.StatusBadRequest)
		return
	}

	id, isNew, err := h.Service.CreateExchangeRequest(userID, req.BookID, req.OfferedBookID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Only send notification if this is a new request (not a duplicate)
	if isNew {
		// Get book details to find the owner and book title
		book, err := h.Service.GetBook(req.BookID)
		if err == nil && book.OwnerID != userID {
			// Get requester name
			requesterName := "Someone" // Default
			if h.NotifService != nil {
				// Create notification for book owner
				notification := models.Notification{
					SenderID:       userID,
					SenderNickname: requesterName,
					Type:           models.NotificationTypeBookRequest,
					Message:        fmt.Sprintf("Someone wants to exchange for your book \"%s\"", book.Title),
					Seen:           false,
					CreatedAt:      time.Now().Format(time.RFC3339),
				}

				// Save to database
				h.NotifService.CreateNotification(models.CreateNotificationRequest{
					UserID:   book.OwnerID,
					SenderID: userID,
					Type:     models.NotificationTypeBookRequest,
					Message:  notification.Message,
				})

				// Send real-time notification via WebSocket
				if h.Hub != nil {
					h.Hub.SendNotification(notification, book.OwnerID)
				}
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]int{"id": id})
}

func (h *BookHandler) SearchBooksHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Missing search query", http.StatusBadRequest)
		return
	}

	results, err := h.Service.SearchBooks(query)
	if err != nil {
		http.Error(w, "Failed to search books", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

// GetExchangeRequestsHandler returns all exchange requests for the current user
func (h *BookHandler) GetExchangeRequestsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	requests, err := h.Service.GetUserExchangeRequests(userID)
	if err != nil {
		http.Error(w, "Failed to fetch exchange requests", http.StatusInternalServerError)
		return
	}

	if requests == nil {
		requests = []models.BookExchangeRequest{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

// UpdateExchangeStatusHandler updates the status of an exchange request (accept/decline)
func (h *BookHandler) UpdateExchangeStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		ExchangeID int    `json:"exchange_id"`
		Status     string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Status != "accepted" && req.Status != "declined" {
		http.Error(w, "Invalid status", http.StatusBadRequest)
		return
	}

	if err := h.Service.UpdateExchangeStatus(req.ExchangeID, userID, req.Status); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// CancelExchangeHandler cancels an exchange request
func (h *BookHandler) CancelExchangeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := h.Session.GetUserIDFromSession(w, r)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		ExchangeID int `json:"exchange_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := h.Service.CancelExchangeRequest(req.ExchangeID, userID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
