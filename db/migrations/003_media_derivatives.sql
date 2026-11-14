-- Generated WebP derivatives for approved, permission-granted local product images.
-- The public delivery route resolves a derivative back to its original media record,
-- so an unapproved or unlicensed original is never exposed through a derivative URL.

CREATE TABLE IF NOT EXISTS media_derivatives (
  id INTEGER PRIMARY KEY,
  media_id INTEGER NOT NULL REFERENCES product_media(id) ON DELETE CASCADE,
  variant TEXT NOT NULL CHECK (variant IN ('thumb','medium','large')),
  file_name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL UNIQUE,
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  mime_type TEXT NOT NULL DEFAULT 'image/webp',
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  checksum TEXT NOT NULL,
  source_checksum TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (media_id, variant)
);

CREATE INDEX IF NOT EXISTS idx_media_derivatives_media ON media_derivatives(media_id);
