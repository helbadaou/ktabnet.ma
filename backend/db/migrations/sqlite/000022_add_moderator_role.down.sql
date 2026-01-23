-- Revert to only user and admin roles
CREATE TABLE users_old (
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
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    is_private INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users_old (id, email, password, first_name, last_name, date_of_birth, nickname, about, avatar, city, role, is_private)
SELECT id, email, password, first_name, last_name, date_of_birth, nickname, about, avatar, city, 
    CASE WHEN role = 'moderator' THEN 'user' ELSE COALESCE(role, 'user') END, 
    COALESCE(is_private, 0)
FROM users;

DROP TABLE users;
ALTER TABLE users_old RENAME TO users;
