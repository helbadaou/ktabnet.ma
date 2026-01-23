-- SQLite doesn't support ALTER COLUMN to modify CHECK constraints
-- We need to recreate the table or just allow any role value
-- For simplicity, we'll create a new table and copy data

-- Create temporary table
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    date_of_birth TEXT,
    nickname TEXT,
    about TEXT,
    avatar TEXT,
    city TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'moderator')),
    is_private INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data
INSERT INTO users_new (id, email, password, first_name, last_name, date_of_birth, nickname, about, avatar, city, role, is_private)
SELECT id, email, password, first_name, last_name, date_of_birth, nickname, about, avatar, city, COALESCE(role, 'user'), COALESCE(is_private, 0)
FROM users;

-- Drop old table
DROP TABLE users;

-- Rename new table
ALTER TABLE users_new RENAME TO users;
