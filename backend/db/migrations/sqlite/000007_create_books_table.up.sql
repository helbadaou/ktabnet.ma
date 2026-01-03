CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    description TEXT,
    genre TEXT CHECK(genre IN ('Fiction', 'Romance', 'Fantasy', 'Science Fiction', 'Mystery', 'Biography', 'History', 'Self-Help')),
    condition TEXT CHECK(condition IN ('new', 'like-new', 'good', 'fair', 'poor')),
    city TEXT CHECK(city IN ('Marrakesh', 'Beni Mellal', 'Casablanca', 'Rabat')) DEFAULT 'Casablanca',
    available BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);
