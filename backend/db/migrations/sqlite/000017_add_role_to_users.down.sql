-- SQLite doesn't support DROP COLUMN directly in older versions
-- This creates a new table without the role column
CREATE TABLE users_backup AS SELECT id, email, password, first_name, last_name, date_of_birth, nickname, about, avatar, created_at, city FROM users;
DROP TABLE users;
ALTER TABLE users_backup RENAME TO users;
