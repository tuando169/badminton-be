-- Chạy file này trong Supabase SQL Editor

DROP TABLE IF EXISTS qr_codes;
DROP TABLE IF EXISTS bills;

CREATE TABLE bills (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_date     TIMESTAMPTZ NOT NULL,
  court_address    TEXT        NOT NULL,
  court_fee        INTEGER     NOT NULL DEFAULT 0,
  shuttlecock_cost INTEGER     NOT NULL DEFAULT 0,
  water_cost       INTEGER     NOT NULL DEFAULT 0,
  other_cost       INTEGER     NOT NULL DEFAULT 0,
  other_cost_note  TEXT        NOT NULL DEFAULT '',
  total_amount     INTEGER     NOT NULL DEFAULT 0,
  players          JSONB       NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE qr_codes (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id      UUID        NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  storage_path TEXT        NOT NULL,
  public_url   TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
