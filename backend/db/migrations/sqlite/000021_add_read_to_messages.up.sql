ALTER TABLE messages ADD COLUMN is_read BOOLEAN DEFAULT 0;

CREATE INDEX idx_messages_unread ON messages(to_id, is_read);
