-- SQLite doesn't support DROP COLUMN directly in older versions
-- Create new table without is_banned
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

INSERT INTO users_new SELECT id, email, password, first_name, last_name, date_of_birth, 
    nickname, about, avatar, city, role, is_private, created_at FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
