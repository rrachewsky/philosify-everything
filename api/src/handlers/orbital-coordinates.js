// ============================================================
// ORBITAL COORDINATES HANDLER
// API endpoints for managing 3D orbital tether positions
// ============================================================

import { jsonResponse } from '../utils/index.js';
import { getSecret } from '../utils/secrets.js';
import {
  assignOrbitalCoordinates,
  validateOrbitalCoordinates,
  isPositionOccupied,
} from '../utils/orbital-assignment.js';

/**
 * POST /api/orbital/assign/:nodeId
 * Auto-assign orbital coordinates to a node
 */
export async function handleAssignOrbitalCoordinates(request, env, nodeId) {
  try {
    const body = await request.json().catch(() => ({}));
    const { z_base = 80, max_x = 15, max_y = 10 } = body;

    // Assign coordinates
    const coords = await assignOrbitalCoordinates(env, { z_base, max_x, max_y });

    // Update the node
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    const updateRes = await fetch(`${supabaseUrl}/rest/v1/graph_nodes?id=eq.${nodeId}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        x_inclination: coords.x_inclination,
        y_inclination: coords.y_inclination,
        z_altitude: coords.z_altitude,
      }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Failed to update node: ${updateRes.status} - ${err}`);
    }

    const updated = await updateRes.json();

    return jsonResponse(
      {
        success: true,
        nodeId,
        coordinates: coords,
        node: updated[0],
      },
      200
    );
  } catch (error) {
    console.error('[OrbitalCoordinates] Assignment failed:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * POST /api/orbital/set/:nodeId
 * Manually set orbital coordinates for a node (with validation)
 */
export async function handleSetOrbitalCoordinates(request, env, nodeId) {
  try {
    const body = await request.json();
    const { x_inclination, y_inclination, z_altitude } = body;

    // Validate coordinates
    validateOrbitalCoordinates(x_inclination, y_inclination, z_altitude);

    // Check if position is occupied
    const occupied = await isPositionOccupied(env, x_inclination, y_inclination, z_altitude);
    if (occupied) {
      return jsonResponse(
        {
          error: 'Position already occupied',
          coordinates: { x_inclination, y_inclination, z_altitude },
        },
        409
      );
    }

    // Update the node
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    const updateRes = await fetch(`${supabaseUrl}/rest/v1/graph_nodes?id=eq.${nodeId}`, {
      method: 'PATCH',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        x_inclination,
        y_inclination,
        z_altitude,
      }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Failed to update node: ${updateRes.status} - ${err}`);
    }

    const updated = await updateRes.json();

    return jsonResponse(
      {
        success: true,
        nodeId,
        coordinates: { x_inclination, y_inclination, z_altitude },
        node: updated[0],
      },
      200
    );
  } catch (error) {
    console.error('[OrbitalCoordinates] Manual set failed:', error);
    return jsonResponse({ error: error.message }, error.message.includes('Invalid') ? 400 : 500);
  }
}

/**
 * GET /api/orbital/check
 * Check if a position is occupied
 */
export async function handleCheckOrbitalPosition(request, env) {
  try {
    const url = new URL(request.url);
    const x = parseFloat(url.searchParams.get('x') || '0');
    const y = parseFloat(url.searchParams.get('y') || '0');
    const z = parseFloat(url.searchParams.get('z') || '80');

    validateOrbitalCoordinates(x, y, z);

    const occupied = await isPositionOccupied(env, x, y, z);

    return jsonResponse({
      coordinates: { x_inclination: x, y_inclination: y, z_altitude: z },
      occupied,
    });
  } catch (error) {
    console.error('[OrbitalCoordinates] Check failed:', error);
    return jsonResponse({ error: error.message }, 400);
  }
}

/**
 * GET /api/orbital/occupied
 * Get all occupied positions
 */
export async function handleGetOccupiedPositions(request, env) {
  try {
    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_occupied_orbital_positions`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`RPC call failed: ${res.status}`);
    }

    const positions = await res.json();

    return jsonResponse({
      count: positions.length,
      positions,
    });
  } catch (error) {
    console.error('[OrbitalCoordinates] Get occupied failed:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}

/**
 * POST /api/orbital/batch-assign
 * Batch assign coordinates to multiple nodes
 */
export async function handleBatchAssignOrbitalCoordinates(request, env) {
  try {
    const body = await request.json();
    const { nodeIds, z_base = 80 } = body;

    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      return jsonResponse({ error: 'nodeIds must be a non-empty array' }, 400);
    }

    const supabaseUrl = await getSecret(env.SUPABASE_URL);
    const supabaseKey = await getSecret(env.SUPABASE_SERVICE_KEY);

    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/batch_assign_orbital_coordinates`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_node_ids: nodeIds,
        p_z_base: z_base,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Batch assignment failed: ${res.status} - ${err}`);
    }

    const assignments = await res.json();

    return jsonResponse({
      success: true,
      count: assignments.length,
      assignments,
    });
  } catch (error) {
    console.error('[OrbitalCoordinates] Batch assign failed:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}
