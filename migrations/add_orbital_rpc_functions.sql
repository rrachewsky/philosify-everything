-- ============================================================
-- ORBITAL COORDINATE RPC FUNCTIONS
-- Database functions for efficient coordinate validation
-- ============================================================

-- Check if an orbital position is already occupied
CREATE OR REPLACE FUNCTION check_orbital_position_occupied(
  p_x FLOAT,
  p_y FLOAT,
  p_z FLOAT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM graph_nodes
  WHERE active = true
    AND ROUND(x_inclination::numeric, 2) = ROUND(p_x::numeric, 2)
    AND ROUND(y_inclination::numeric, 2) = ROUND(p_y::numeric, 2)
    AND ROUND(z_altitude::numeric, 2) = ROUND(p_z::numeric, 2);
  
  RETURN v_count > 0;
END;
$$;

-- Get all occupied orbital positions (for efficient bulk checking)
CREATE OR REPLACE FUNCTION get_occupied_orbital_positions()
RETURNS TABLE (
  x_inclination FLOAT,
  y_inclination FLOAT,
  z_altitude FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(gn.x_inclination::numeric, 2)::FLOAT,
    ROUND(gn.y_inclination::numeric, 2)::FLOAT,
    ROUND(gn.z_altitude::numeric, 2)::FLOAT
  FROM graph_nodes gn
  WHERE gn.active = true
    AND gn.x_inclination IS NOT NULL
    AND gn.y_inclination IS NOT NULL
    AND gn.z_altitude IS NOT NULL;
END;
$$;

-- Find nearest available orbital position to a target location
CREATE OR REPLACE FUNCTION find_nearest_orbital_position(
  p_target_x FLOAT DEFAULT 0,
  p_target_y FLOAT DEFAULT 0,
  p_target_z FLOAT DEFAULT 80,
  p_max_distance FLOAT DEFAULT 20
)
RETURNS TABLE (
  x_inclination FLOAT,
  y_inclination FLOAT,
  z_altitude FLOAT,
  distance FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  WITH candidate_positions AS (
    -- Generate a grid of candidate positions around the target
    SELECT
      ROUND((p_target_x + dx)::numeric, 2)::FLOAT AS x,
      ROUND((p_target_y + dy)::numeric, 2)::FLOAT AS y,
      ROUND((p_target_z + dz)::numeric, 2)::FLOAT AS z,
      SQRT(dx*dx + dy*dy + (dz/10)*(dz/10)) AS dist -- Scale z differently (km vs degrees)
    FROM
      generate_series(-15, 15, 0.5) AS dx,
      generate_series(-10, 10, 0.5) AS dy,
      generate_series(-20, 20, 5) AS dz
    WHERE
      ABS(p_target_x + dx) <= 15
      AND ABS(p_target_y + dy) <= 10
      AND (p_target_z + dz) BETWEEN 60 AND 120
      AND SQRT(dx*dx + dy*dy + (dz/10)*(dz/10)) <= p_max_distance
  ),
  occupied_positions AS (
    SELECT
      ROUND(gn.x_inclination::numeric, 2) AS x,
      ROUND(gn.y_inclination::numeric, 2) AS y,
      ROUND(gn.z_altitude::numeric, 2) AS z
    FROM graph_nodes gn
    WHERE gn.active = true
  )
  SELECT
    cp.x,
    cp.y,
    cp.z,
    cp.dist
  FROM candidate_positions cp
  WHERE NOT EXISTS (
    SELECT 1 FROM occupied_positions op
    WHERE op.x = cp.x AND op.y = cp.y AND op.z = cp.z
  )
  ORDER BY cp.dist ASC
  LIMIT 1;
END;
$$;

-- Batch assign coordinates to multiple nodes
CREATE OR REPLACE FUNCTION batch_assign_orbital_coordinates(
  p_node_ids TEXT[],
  p_z_base FLOAT DEFAULT 80
)
RETURNS TABLE (
  node_id TEXT,
  x_inclination FLOAT,
  y_inclination FLOAT,
  z_altitude FLOAT
)
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
  v_node_id TEXT;
  v_coords RECORD;
BEGIN
  FOREACH v_node_id IN ARRAY p_node_ids
  LOOP
    -- Find nearest available position
    SELECT * INTO v_coords
    FROM find_nearest_orbital_position(0, 0, p_z_base, 20)
    LIMIT 1;
    
    IF v_coords IS NULL THEN
      RAISE EXCEPTION 'No available orbital position found for node %', v_node_id;
    END IF;
    
    -- Update the node
    UPDATE graph_nodes
    SET
      x_inclination = v_coords.x_inclination,
      y_inclination = v_coords.y_inclination,
      z_altitude = v_coords.z_altitude
    WHERE id = v_node_id;
    
    -- Return the assignment
    RETURN QUERY SELECT
      v_node_id,
      v_coords.x_inclination,
      v_coords.y_inclination,
      v_coords.z_altitude;
  END LOOP;
END;
$$;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION check_orbital_position_occupied TO service_role;
GRANT EXECUTE ON FUNCTION get_occupied_orbital_positions TO service_role;
GRANT EXECUTE ON FUNCTION find_nearest_orbital_position TO service_role;
GRANT EXECUTE ON FUNCTION batch_assign_orbital_coordinates TO service_role;

-- Comments
COMMENT ON FUNCTION check_orbital_position_occupied IS 'Check if orbital coordinates (x,y,z) are already occupied by an active node';
COMMENT ON FUNCTION get_occupied_orbital_positions IS 'Get all currently occupied orbital positions (for bulk validation)';
COMMENT ON FUNCTION find_nearest_orbital_position IS 'Find the nearest unoccupied orbital position to a target location';
COMMENT ON FUNCTION batch_assign_orbital_coordinates IS 'Assign unique orbital coordinates to multiple nodes in a single transaction';
