DROP INDEX IF EXISTS idx_messages_unread;

-- SQLite doesn't support DROP COLUMN directly, but for rollback this is sufficient
-- In production, you would need to recreate the table without the column
