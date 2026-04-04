// ============================================================
// ORBITAL COORDINATE AUTO-ASSIGNMENT
// Automatically assigns unique (x, y, z) coordinates to nodes
// ============================================================

import { getSecret } from './secrets.js';

/**
 * Assigns available orbital coordinates to a node
 * Uses spiral search pattern from birthplace (0, 0, z_base)
 * 
 * @param {Object} env - Cloudflare Worker environment
 * @param {Object} options - Assignment options
 * @param {number} [options.z_base=80] - Base altitude in km
 * @param {number} [options.max_x=15] - Max East/West inclination
 * @param {number} [options.max_y=10] - Max North/South inclination
 * @param {number} [options.precision=2] - Decimal precision for coordinates
 * @returns {Promise<{x_inclination: number, y_inclination: number, z_altitude: number}>}
 */
export async function assignOrbitalCoordinates(env, options = {}) {
  const {
    z_base = 80,
    max_x = 15,
    max_y = 10,
    precision = 2,
  } = options;

  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  // Fetch all existing active coordinates
  const res = await fetch(
    `${supabaseUrl}/rest/v1/graph_nodes?active=eq.true&select=x_inclination,y_inclination,z_altitude`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch orbital coordinates: ${res.status}`);
  }

  const existingCoords = await res.json();
  
  // Build a Set of occupied positions for O(1) lookup
  const occupied = new Set(
    existingCoords.map((c) =>
      `${round(c.x_inclination, precision)},${round(c.y_inclination, precision)},${round(c.z_altitude, precision)}`
    )
  );

  /**
   * Spiral search pattern:
   * 1. Start at birthplace (0, 0, z_base)
   * 2. Expand in concentric rings (x, y)
   * 3. Try z variations if position occupied
   * 4. Stay within reasonable bounds (≤15° inclination)
   */
  
  // Try birthplace first
  if (!isOccupied(0, 0, z_base)) {
    return { x_inclination: 0, y_inclination: 0, z_altitude: z_base };
  }

  // Spiral outward in rings
  for (let radius = 1; radius <= Math.max(max_x, max_y); radius++) {
    // Generate points in current ring
    const candidates = generateRingPoints(radius, max_x, max_y, precision);
    
    for (const { x, y } of candidates) {
      // Try base altitude first
      if (!isOccupied(x, y, z_base)) {
        return { x_inclination: x, y_inclination: y, z_altitude: z_base };
      }
      
      // Try altitude variations ±5 km, ±10 km, ±15 km
      for (const z_offset of [5, -5, 10, -10, 15, -15, 20, -20]) {
        const z = z_base + z_offset;
        if (z >= 60 && z <= 120 && !isOccupied(x, y, z)) {
          return { x_inclination: x, y_inclination: y, z_altitude: z };
        }
      }
    }
  }

  // Fallback: random assignment within bounds (should never reach here with proper bounds)
  console.warn('[OrbitalAssignment] Spiral search exhausted, using random fallback');
  for (let attempt = 0; attempt < 1000; attempt++) {
    const x = round(Math.random() * max_x * 2 - max_x, precision);
    const y = round(Math.random() * max_y * 2 - max_y, precision);
    const z = round(z_base + (Math.random() * 40 - 20), precision);
    
    if (!isOccupied(x, y, z)) {
      return { x_inclination: x, y_inclination: y, z_altitude: z };
    }
  }

  throw new Error('Failed to find available orbital coordinates after 1000 attempts');

  // Helper functions
  function isOccupied(x, y, z) {
    const key = `${round(x, precision)},${round(y, precision)},${round(z, precision)}`;
    return occupied.has(key);
  }
}

/**
 * Generate points in a concentric ring at given radius
 * Uses square ring pattern for simplicity
 */
function generateRingPoints(radius, max_x, max_y, precision) {
  const points = [];
  const step = Math.pow(10, -precision); // e.g., 0.01 for precision=2

  // Top and bottom edges (y = ±radius)
  for (let x = -radius; x <= radius; x += step) {
    if (Math.abs(x) <= max_x) {
      if (radius <= max_y) {
        points.push({ x: round(x, precision), y: round(radius, precision) });
        if (radius > 0) {
          points.push({ x: round(x, precision), y: round(-radius, precision) });
        }
      }
    }
  }

  // Left and right edges (x = ±radius), excluding corners already added
  for (let y = -radius + step; y < radius; y += step) {
    if (Math.abs(y) <= max_y) {
      if (radius <= max_x) {
        points.push({ x: round(radius, precision), y: round(y, precision) });
        if (radius > 0) {
          points.push({ x: round(-radius, precision), y: round(y, precision) });
        }
      }
    }
  }

  return points;
}

/**
 * Round number to given decimal precision
 */
function round(num, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor) / factor;
}

/**
 * Validate orbital coordinates
 */
export function validateOrbitalCoordinates(x, y, z) {
  if (typeof x !== 'number' || x < -15 || x > 15) {
    throw new Error(`Invalid x_inclination: ${x} (must be -15 to 15)`);
  }
  if (typeof y !== 'number' || y < -10 || y > 10) {
    throw new Error(`Invalid y_inclination: ${y} (must be -10 to 10)`);
  }
  if (typeof z !== 'number' || z < 0 || z > 200) {
    throw new Error(`Invalid z_altitude: ${z} (must be 0 to 200)`);
  }
  return true;
}

/**
 * Check if coordinates are already occupied
 */
export async function isPositionOccupied(env, x, y, z, precision = 2) {
  const supabaseUrl = await getSecret(env.SUPABASE_URL);
  const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

  const x_rounded = round(x, precision);
  const y_rounded = round(y, precision);
  const z_rounded = round(z, precision);

  const res = await fetch(
    `${supabaseUrl}/rest/v1/rpc/check_orbital_position_occupied`,
    {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_x: x_rounded,
        p_y: y_rounded,
        p_z: z_rounded,
      }),
    }
  );

  if (!res.ok) {
    // Fallback: direct query if RPC doesn't exist yet
    const fallbackRes = await fetch(
      `${supabaseUrl}/rest/v1/graph_nodes?active=eq.true&select=id`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    
    const nodes = await fallbackRes.json();
    return nodes.some(
      (n) =>
        round(n.x_inclination, precision) === x_rounded &&
        round(n.y_inclination, precision) === y_rounded &&
        round(n.z_altitude, precision) === z_rounded
    );
  }

  const result = await res.json();
  return result.occupied === true;
}
