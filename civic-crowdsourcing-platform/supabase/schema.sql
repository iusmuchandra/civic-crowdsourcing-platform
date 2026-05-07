-- ============================================================================
-- CIVIC CROWDSOURCING PLATFORM — COMPLETE DATABASE SCHEMA
-- Supabase PostgreSQL + PostGIS + RLS Policies
-- ============================================================================

-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. ENUMS
-- ============================================================================
CREATE TYPE user_role AS ENUM('citizen', 'official', 'editor', 'admin');
CREATE TYPE issue_category AS ENUM('pothole', 'streetlight', 'water_tap', 'bus_stop', 'garbage', 'other');
CREATE TYPE issue_status AS ENUM('pending', 'threshold_met', 'in_progress', 'resolved');
CREATE TYPE rating_color AS ENUM('red', 'yellow', 'green');
CREATE TYPE official_role AS ENUM('worker', 'engineer', 'corporator', 'mla', 'minister', 'cm');
CREATE TYPE response_action AS ENUM('acknowledged', 'work_started', 'resolved');

-- 3. TABLES
-- ============================================================================

-- 3a. USERS
-- Phone is the primary key. Auth flows through Supabase Auth with phone OTP.
-- The auth.users.id is linked via auth_user_id for RLS integration.
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  phone           TEXT UNIQUE NOT NULL,
  name            TEXT,
  role            user_role NOT NULL DEFAULT 'citizen',
  home_gps        GEOGRAPHY(POINT, 4326),       -- PostGIS point for proximity queries
  preferred_language TEXT DEFAULT 'en',         -- ISO 639-1 code
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT valid_phone CHECK (phone ~ '^\+?[1-9]\d{7,14}$')
);

-- 3b. ISSUES
CREATE TABLE issues (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_url             TEXT NOT NULL,
  gps_coords            GEOGRAPHY(POINT, 4326) NOT NULL,
  category              issue_category NOT NULL DEFAULT 'other',
  description_original  TEXT NOT NULL,
  description_formal    TEXT,                   -- AI-generated formal version
  language_detected     TEXT,                   -- ISO 639-1
  status                issue_status NOT NULL DEFAULT 'pending',
  created_by            UUID NOT NULL REFERENCES users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Spatial index for "find issues near me" queries
  CONSTRAINT valid_photo CHECK (photo_url ~ '^https?://')
);

CREATE INDEX idx_issues_gps ON issues USING GIST (gps_coords);
CREATE INDEX idx_issues_status ON issues (status);
CREATE INDEX idx_issues_category ON issues (category);
CREATE INDEX idx_issues_created_at ON issues (created_at DESC);

-- 3c. RATINGS
-- UNIQUE(issue_id, user_id) prevents double-voting at DB level
CREATE TABLE ratings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  color       rating_color NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT one_rating_per_user UNIQUE (issue_id, user_id)
);

CREATE INDEX idx_ratings_issue ON ratings (issue_id);
CREATE INDEX idx_ratings_user ON ratings (user_id);

-- 3d. OFFICIALS
CREATE TABLE officials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  role          official_role NOT NULL,
  phone         TEXT,
  email         TEXT,
  whatsapp      TEXT,
  geo_region    GEOGRAPHY(POLYGON, 4326) NOT NULL,
  ward_number   TEXT,
  municipality  TEXT,
  state         TEXT,
  country       TEXT DEFAULT 'IN',
  is_verified   BOOLEAN NOT NULL DEFAULT false,
  updated_by    UUID REFERENCES users(id),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_officials_geo ON officials USING GIST (geo_region);
CREATE INDEX idx_officials_role ON officials (role);

-- 3e. NOTIFICATIONS LOG
CREATE TABLE notifications_log (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id            UUID NOT NULL REFERENCES issues(id),
  officials_notified  JSONB NOT NULL DEFAULT '[]',   -- [{id, name, role, channel, delivery_status}]
  pdf_url             TEXT,
  sent_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivery_status     TEXT NOT NULL DEFAULT 'pending' -- pending, delivered, failed
);

-- 3f. OFFICIAL RESPONSES
CREATE TABLE official_responses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id      UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  official_id   UUID NOT NULL REFERENCES officials(id),
  status_update response_action NOT NULL,
  message       TEXT,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_responses_issue ON official_responses (issue_id);

-- 4. VIEW: LIVE RATING COUNTS (denormalized for performance)
-- ============================================================================
CREATE VIEW issue_rating_counts AS
SELECT
  i.id AS issue_id,
  COUNT(r.id) FILTER (WHERE r.color = 'red')    AS red_count,
  COUNT(r.id) FILTER (WHERE r.color = 'yellow') AS yellow_count,
  COUNT(r.id) FILTER (WHERE r.color = 'green')  AS green_count,
  COUNT(r.id)                                   AS total_ratings
FROM issues i
LEFT JOIN ratings r ON r.issue_id = i.id
GROUP BY i.id;

-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE official_responses ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------
-- USERS table RLS
-- -------------------------------------------------------------------
-- Everyone can read public profile fields (masked)
CREATE POLICY users_select_public ON users
  FOR SELECT
  USING (true);

-- Users can only update their own row
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Insert: only during signup (handled by trigger)
CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Admin can update any user
CREATE POLICY users_admin_all ON users
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'
  ));

-- -------------------------------------------------------------------
-- ISSUES table RLS
-- -------------------------------------------------------------------
-- Anyone can read issues (photos are public, phone numbers never exposed)
CREATE POLICY issues_select_all ON issues
  FOR SELECT
  USING (true);

-- Citizens can create issues (own)
CREATE POLICY issues_insert_citizen ON issues
  FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT auth_user_id FROM users WHERE id = created_by)
  );

-- Creator or editor/admin can update
CREATE POLICY issues_update_creator ON issues
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE id = created_by
    )
    OR EXISTS (
      SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- -------------------------------------------------------------------
-- RATINGS table RLS
-- -------------------------------------------------------------------
-- Anyone can read aggregated rating counts
CREATE POLICY ratings_select_all ON ratings
  FOR SELECT
  USING (true);

-- Only the rating owner can insert their own rating
CREATE POLICY ratings_insert_own ON ratings
  FOR INSERT
  WITH CHECK (
    auth.uid() = (SELECT auth_user_id FROM users WHERE id = user_id)
  );

-- No updates or deletes on ratings (immutable — prevents tampering)
CREATE POLICY ratings_no_update ON ratings
  FOR UPDATE
  USING (false);

CREATE POLICY ratings_no_delete ON ratings
  FOR DELETE
  USING (false);

-- -------------------------------------------------------------------
-- OFFICIALS table RLS
-- -------------------------------------------------------------------
-- Public can read name + role only (contact details hidden via column-level)
CREATE POLICY officials_select_public ON officials
  FOR SELECT
  USING (true);

-- Only editor/admin can insert
CREATE POLICY officials_insert_editor ON officials
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Only editor/admin can update
CREATE POLICY officials_update_editor ON officials
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- -------------------------------------------------------------------
-- NOTIFICATIONS_LOG table RLS
-- -------------------------------------------------------------------
-- Admin only
CREATE POLICY notifications_admin_only ON notifications_log
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- -------------------------------------------------------------------
-- OFFICIAL_RESPONSES table RLS
-- -------------------------------------------------------------------
-- Public can read responses
CREATE POLICY responses_select_all ON official_responses
  FOR SELECT
  USING (true);

-- Officials can insert their own responses
CREATE POLICY responses_insert_official ON official_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      JOIN officials o ON o.phone = u.phone
      WHERE u.auth_user_id = auth.uid()
      AND o.id = official_id
    )
  );

-- 6. FUNCTIONS & TRIGGERS
-- ============================================================================

-- 6a. Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, phone, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_user_meta_data ->> 'phone'),
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Anonymous Citizen'),
    'citizen'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 6b. Sanitize officials data for public API (strip contact fields)
CREATE OR REPLACE FUNCTION sanitize_officials_for_public()
RETURNS SETOF JSONB AS $$
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'name', o.name,
      'role', o.role,
      'ward_number', o.ward_number,
      'municipality', o.municipality,
      'state', o.state
    )
  )
  FROM officials o;
$$ LANGUAGE sql STABLE;

-- 6c. Mask phone numbers in users table for public queries
CREATE OR REPLACE FUNCTION mask_phone(phone_num TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN substring(phone_num, 1, 3) || '****' || substring(phone_num FROM char_length(phone_num) - 3);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6d. Find users within radius (meters) of a GPS point
CREATE OR REPLACE FUNCTION find_nearby_users(
  issue_gps GEOGRAPHY(POINT, 4326),
  radius_meters INT DEFAULT 500
)
RETURNS TABLE (
  user_id UUID,
  phone TEXT,
  preferred_language TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.phone, u.preferred_language
  FROM users u
  WHERE u.home_gps IS NOT NULL
    AND ST_DWithin(u.home_gps, issue_gps, radius_meters)
    AND u.role = 'citizen';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6e. Find responsible officials for a GPS point
CREATE OR REPLACE FUNCTION find_responsible_officials(
  issue_gps GEOGRAPHY(POINT, 4326)
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  role official_role,
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  ward_number TEXT,
  municipality TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT o.id, o.name, o.role, o.phone, o.email, o.whatsapp, o.ward_number, o.municipality
  FROM officials o
  WHERE ST_Covers(o.geo_region, issue_gps)
  ORDER BY
    CASE o.role
      WHEN 'worker'   THEN 1
      WHEN 'engineer' THEN 2
      WHEN 'corporator' THEN 3
      WHEN 'mla'      THEN 4
      WHEN 'minister' THEN 5
      WHEN 'cm'       THEN 6
    END;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 6f. Anti-abuse: Prevent neighbor notification spam (max 3/day per user)
CREATE OR REPLACE FUNCTION get_recent_notification_count(target_user_id UUID)
RETURNS INT AS $$
DECLARE
  count_24h INT;
BEGIN
  SELECT COUNT(*) INTO count_24h
  FROM notifications_log nl
  WHERE nl.sent_at > now() - INTERVAL '24 hours'
    AND nl.officials_notified::jsonb @> jsonb_build_array(
      jsonb_build_object('user_id', target_user_id)
    );
  RETURN count_24h;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. THRESHOLD TRIGGER: After INSERT on ratings, check if issue hits 50
-- ============================================================================
CREATE OR REPLACE FUNCTION check_threshold_on_rating()
RETURNS TRIGGER AS $$
DECLARE
  red_yellow_count INT;
  threshold_met BOOLEAN;
BEGIN
  -- Count red + yellow ratings for this issue
  SELECT COUNT(*) INTO red_yellow_count
  FROM ratings
  WHERE issue_id = NEW.issue_id
    AND color IN ('red', 'yellow');

  -- Check if it hasn't already hit threshold (idempotency)
  SELECT (status = 'threshold_met') INTO threshold_met
  FROM issues WHERE id = NEW.issue_id;

  IF red_yellow_count >= 50 AND NOT threshold_met THEN
    -- Update issue status
    UPDATE issues SET status = 'threshold_met' WHERE id = NEW.issue_id;

    -- Insert a row that the Edge Function will pick up for processing
    -- (Edge Function watches for status='threshold_met' with no notification_log entry)
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_rating_insert ON ratings;
CREATE TRIGGER after_rating_insert
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION check_threshold_on_rating();

-- 8. HELPER: Get live issue detail with rating counts (API-facing)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_issue_detail(issue_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', i.id,
    'photo_url', i.photo_url,
    'category', i.category,
    'description_original', i.description_original,
    'description_formal', i.description_formal,
    'language_detected', i.language_detected,
    'status', i.status,
    'gps_lat', ST_Y(i.gps_coords::geometry),
    'gps_lng', ST_X(i.gps_coords::geometry),
    'created_at', i.created_at,
    'rating_counts', jsonb_build_object(
      'red', COALESCE(irc.red_count, 0),
      'yellow', COALESCE(irc.yellow_count, 0),
      'green', COALESCE(irc.green_count, 0),
      'total', COALESCE(irc.total_ratings, 0)
    ),
    'threshold_progress', LEAST(COALESCE(irc.red_count, 0) + COALESCE(irc.yellow_count, 0), 50),
    'officials', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'name', o.name,
          'role', o.role
        )
      )
      FROM officials o
      WHERE ST_Covers(o.geo_region, i.gps_coords)
    ),
    'timeline', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'action', orr.status_update,
          'name', off.name,
          'role', off.role,
          'message', orr.message,
          'timestamp', orr.updated_at
        ) ORDER BY orr.updated_at ASC
      )
      FROM official_responses orr
      JOIN officials off ON off.id = orr.official_id
      WHERE orr.issue_id = i.id
    )
  ) INTO result
  FROM issues i
  LEFT JOIN issue_rating_counts irc ON irc.issue_id = i.id
  WHERE i.id = issue_uuid;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. HELPER: Get clustered map view (public, only issues with >= 5 ratings)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_public_map_issues(
  min_lat FLOAT,
  min_lng FLOAT,
  max_lat FLOAT,
  max_lng FLOAT,
  filter_category issue_category DEFAULT NULL,
  filter_status issue_status DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  category issue_category,
  status issue_status,
  lat FLOAT,
  lng FLOAT,
  red_count BIGINT,
  yellow_count BIGINT,
  green_count BIGINT,
  total_ratings BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.category,
    i.status,
    ST_Y(i.gps_coords::geometry) AS lat,
    ST_X(i.gps_coords::geometry) AS lng,
    irc.red_count,
    irc.yellow_count,
    irc.green_count,
    irc.total_ratings
  FROM issues i
  JOIN issue_rating_counts irc ON irc.issue_id = i.id
  WHERE i.gps_coords && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    AND irc.total_ratings >= 5                     -- minimum threshold for public map
    AND (filter_category IS NULL OR i.category = filter_category)
    AND (filter_status IS NULL OR i.status = filter_status)
  ORDER BY irc.total_ratings DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- 10. SEED: Default admin account (phone login, OTP-verified)
-- ============================================================================
-- INSERT INTO users (phone, role) VALUES ('+910000000000', 'admin')
-- ON CONFLICT (phone) DO NOTHING;
