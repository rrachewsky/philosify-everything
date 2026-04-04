-- ============================================================
-- ADD 3D ORBITAL COORDINATES TO GRAPH NODES
-- Implements tether-based orbital positioning system
-- ============================================================

-- Add 3D orbital coordinate columns
ALTER TABLE graph_nodes
  ADD COLUMN IF NOT EXISTS x_inclination FLOAT DEFAULT 0 CHECK (x_inclination BETWEEN -15 AND 15),
  ADD COLUMN IF NOT EXISTS y_inclination FLOAT DEFAULT 0 CHECK (y_inclination BETWEEN -10 AND 10),
  ADD COLUMN IF NOT EXISTS z_altitude FLOAT DEFAULT 80 CHECK (z_altitude BETWEEN 0 AND 200);

-- Add geographic birthplace coordinates (referenced by handler but not yet in schema)
ALTER TABLE graph_nodes
  ADD COLUMN IF NOT EXISTS latitude FLOAT CHECK (latitude BETWEEN -90 AND 90),
  ADD COLUMN IF NOT EXISTS longitude FLOAT CHECK (longitude BETWEEN -180 AND 180);

-- Create composite unique constraint: no two nodes can share the same 3D orbital position
-- We round to 2 decimal places to avoid floating-point precision issues
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_orbital_position
  ON graph_nodes (
    ROUND(x_inclination::numeric, 2),
    ROUND(y_inclination::numeric, 2),
    ROUND(z_altitude::numeric, 2)
  )
  WHERE active = true;

-- Index for efficient spatial queries
CREATE INDEX IF NOT EXISTS idx_orbital_coordinates
  ON graph_nodes (x_inclination, y_inclination, z_altitude)
  WHERE active = true;

-- Index for birthplace queries
CREATE INDEX IF NOT EXISTS idx_birthplace_coordinates
  ON graph_nodes (latitude, longitude)
  WHERE active = true AND latitude IS NOT NULL;

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON COLUMN graph_nodes.x_inclination IS 'East/West inclination of orbital tether in degrees (-15 to +15, positive = East)';
COMMENT ON COLUMN graph_nodes.y_inclination IS 'North/South inclination of orbital tether in degrees (-10 to +10, positive = North)';
COMMENT ON COLUMN graph_nodes.z_altitude IS 'Altitude of orbital platform in kilometers above sea level (0-200 km)';
COMMENT ON COLUMN graph_nodes.latitude IS 'Geographic birthplace latitude (-90 to +90)';
COMMENT ON COLUMN graph_nodes.longitude IS 'Geographic birthplace longitude (-180 to +180)';
