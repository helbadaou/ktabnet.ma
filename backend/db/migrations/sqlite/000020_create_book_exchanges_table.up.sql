CREATE TABLE IF NOT EXISTS book_exchanges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    offered_book_id INTEGER NOT NULL,
    requester_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (offered_book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_book_exchanges_book_id ON book_exchanges(book_id);
CREATE INDEX IF NOT EXISTS idx_book_exchanges_requester_id ON book_exchanges(requester_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_book_exchanges_pending_unique ON book_exchanges(book_id, offered_book_id, requester_id, status);
