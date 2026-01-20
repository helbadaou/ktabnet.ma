package services

import (
	"social/models"
	"social/repositories"
)

type BookService struct {
	Repo *repositories.BookRepository
}

func NewBookService(repo *repositories.BookRepository) *BookService {
	return &BookService{Repo: repo}
}

func (s *BookService) CreateBook(book models.Book) (int, error) {
	return s.Repo.CreateBook(book)
}

func (s *BookService) GetBook(bookID int) (models.Book, error) {
	return s.Repo.GetBookByID(bookID)
}

func (s *BookService) GetUserBooks(userID int) ([]models.Book, error) {
	return s.Repo.GetUserBooks(userID)
}

func (s *BookService) GetUserBooksWithOwner(userID int) ([]models.BookWithOwner, error) {
	return s.Repo.GetUserBooksWithOwner(userID)
}

func (s *BookService) GetFeedBooks(currentUserID int) ([]models.Book, error) {
	return s.Repo.GetAllBooks(currentUserID)
}

func (s *BookService) GetFeedBooksWithOwner(currentUserID int) ([]models.BookWithOwner, error) {
	return s.Repo.GetAllBooksWithOwner(currentUserID)
}

func (s *BookService) UpdateBook(book models.Book) error {
	return s.Repo.UpdateBook(book)
}

func (s *BookService) DeleteBook(bookID int) error {
	return s.Repo.DeleteBook(bookID)
}

func (s *BookService) AddImage(bookID int, imageURL string, isPrimary bool) error {
	return s.Repo.AddImage(bookID, imageURL, isPrimary)
}

func (s *BookService) RemoveImage(imageID int) error {
	return s.Repo.RemoveImage(imageID)
}

func (s *BookService) SearchBooks(query string) ([]models.BookSearchResult, error) {
	if query == "" {
		return nil, nil
	}
	return s.Repo.SearchBooks(query)
}
