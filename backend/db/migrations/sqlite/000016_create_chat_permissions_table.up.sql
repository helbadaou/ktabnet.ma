CREATE TABLE IF NOT EXISTS chat_permissions (
    user_a_id INTEGER NOT NULL,
    user_b_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK(user_a_id <> user_b_id),
    CHECK(user_a_id < user_b_id),
    PRIMARY KEY (user_a_id, user_b_id),
    FOREIGN KEY (user_a_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_b_id) REFERENCES users(id) ON DELETE CASCADE
);
