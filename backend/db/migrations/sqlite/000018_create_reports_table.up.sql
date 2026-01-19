CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    reported_type TEXT NOT NULL CHECK(reported_type IN ('user', 'book')),
    reported_id INTEGER NOT NULL,
    reason TEXT NOT NULL CHECK(reason IN ('spam', 'inappropriate', 'fake', 'harassment', 'other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reported_type ON reports(reported_type);
CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
