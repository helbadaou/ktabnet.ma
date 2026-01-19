package services

import (
	"errors"

	"social/models"
	"social/repositories"
)

type ReportService struct {
	Repo *repositories.ReportRepository
}

func NewReportService(repo *repositories.ReportRepository) *ReportService {
	return &ReportService{Repo: repo}
}

func (s *ReportService) CreateReport(userID int, req models.CreateReportRequest) (int, error) {
	if req.ReportedType != "user" && req.ReportedType != "book" {
		return 0, errors.New("invalid reported type")
	}

	validReasons := map[string]bool{
		"spam": true, "inappropriate": true, "fake": true, "harassment": true, "other": true,
	}
	if !validReasons[req.Reason] {
		return 0, errors.New("invalid reason")
	}

	report := models.Report{
		ReporterID:   userID,
		ReportedType: req.ReportedType,
		ReportedID:   req.ReportedID,
		Reason:       req.Reason,
		Description:  req.Description,
	}

	return s.Repo.Create(report)
}

func (s *ReportService) GetReport(id int) (*models.Report, error) {
	return s.Repo.GetByID(id)
}

func (s *ReportService) GetAllReports(status string) ([]models.ReportWithDetails, error) {
	return s.Repo.GetAll(status)
}

func (s *ReportService) UpdateReport(id int, adminID int, req models.UpdateReportRequest) error {
	validStatuses := map[string]bool{
		"pending": true, "reviewed": true, "resolved": true, "dismissed": true,
	}
	if !validStatuses[req.Status] {
		return errors.New("invalid status")
	}

	return s.Repo.Update(id, req.Status, req.AdminNotes, adminID)
}

func (s *ReportService) DeleteReport(id int) error {
	return s.Repo.Delete(id)
}

func (s *ReportService) IsAdmin(userID int) (bool, error) {
	role, err := s.Repo.GetUserRole(userID)
	if err != nil {
		return false, err
	}
	return role == "admin", nil
}

func (s *ReportService) SetUserRole(userID int, role string) error {
	if role != "user" && role != "admin" {
		return errors.New("invalid role")
	}
	return s.Repo.SetUserRole(userID, role)
}

func (s *ReportService) DeleteBook(bookID int) error {
	return s.Repo.DeleteBook(bookID)
}

func (s *ReportService) GetAllUsers() ([]models.UserAdmin, error) {
	return s.Repo.GetAllUsers()
}

func (s *ReportService) DeleteUser(userID int) error {
	return s.Repo.DeleteUser(userID)
}

func (s *ReportService) GetUserRole(userID int) (string, error) {
	return s.Repo.GetUserRole(userID)
}
