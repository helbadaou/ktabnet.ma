package services

import (
	"social/models"
	"social/repositories"
)

type ProfileService struct {
	ProfileRepo repositories.SqliteProfileRepo
}

func NewProfileService(repo repositories.SqliteProfileRepo) *ProfileService {
	return &ProfileService{ProfileRepo: repo}
}

func (s *ProfileService) GetUserProfile(requesterID, targetID int) (*models.Profile, error) {
	user, err := s.ProfileRepo.FindByID(targetID)
	if err != nil {
		return nil, err
	}

	user.IsOwner = (requesterID == targetID)

	if !user.IsOwner {
		isFollowed, err := s.ProfileRepo.IsFollowing(requesterID, user.ID)
		if err == nil {
			user.IsFollowed = isFollowed
		}
		isPending, err := s.ProfileRepo.IsPending(requesterID, user.ID)
		if err == nil {
			user.IsPending = isPending
		}
	}

	if user.IsPrivate && !user.IsOwner && !user.IsFollowed {
		user.FirstName = ""
		user.LastName = ""
		user.Nickname = ""
		user.Email = ""
		user.About = ""
		user.DateOfBirth = ""
	}
	return user, nil
}

func (us *ProfileService) SearchUsers(query string) ([]models.SearchResult, error) {
	if query == "" {
		return nil, nil
	}
	return us.ProfileRepo.SearchUsers(query)
}

func (s *ProfileService) TogglePrivacy(userID int, isPrivate bool) error {
	return s.ProfileRepo.TogglePrivacy(userID, isPrivate)
}

func (s *ProfileService) UpdateProfile(userID int, req models.UpdateProfileRequest) error {
	return s.ProfileRepo.UpdateProfile(userID, req)
}

func (s *ProfileService) GetUserByID(userID int) (*models.User, error) {
	return s.ProfileRepo.GetByID(userID)
}

func (s *ProfileService) BanUser(userID int) error {
	return s.ProfileRepo.BanUser(userID)
}

func (s *ProfileService) UnbanUser(userID int) error {
	return s.ProfileRepo.UnbanUser(userID)
}

func (s *ProfileService) IsBanned(userID int) bool {
	user, err := s.ProfileRepo.GetByID(userID)
	if err != nil {
		return false
	}
	return user.IsBanned
}
