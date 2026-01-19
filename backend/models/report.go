package models

import "time"

type Report struct {
	ID           int        `json:"id"`
	ReporterID   int        `json:"reporter_id"`
	ReportedType string     `json:"reported_type"` // "user" or "book"
	ReportedID   int        `json:"reported_id"`
	Reason       string     `json:"reason"`
	Description  string     `json:"description"`
	Status       string     `json:"status"` // pending, reviewed, resolved, dismissed
	AdminNotes   string     `json:"admin_notes"`
	CreatedAt    time.Time  `json:"created_at"`
	ResolvedAt   *time.Time `json:"resolved_at,omitempty"`
	ResolvedBy   *int       `json:"resolved_by,omitempty"`
}

type ReportWithDetails struct {
	Report
	ReporterName   string `json:"reporter_name"`
	ReporterAvatar string `json:"reporter_avatar"`
	ReportedName   string `json:"reported_name"` // Book title or User name
}

type CreateReportRequest struct {
	ReportedType string `json:"reported_type"`
	ReportedID   int    `json:"reported_id"`
	Reason       string `json:"reason"`
	Description  string `json:"description"`
}

type UpdateReportRequest struct {
	Status     string `json:"status"`
	AdminNotes string `json:"admin_notes"`
}

type UserAdmin struct {
	ID        int       `json:"id"`
	Email     string    `json:"email"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Nickname  string    `json:"nickname"`
	Avatar    string    `json:"avatar"`
	City      string    `json:"city"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}
