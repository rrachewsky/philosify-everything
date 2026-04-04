# 3D Orbital Coordinate System

## Overview

The Philosify History Graph uses a **3D orbital tether coordinate system** to position nodes (philosophers, events, concepts) in space. Each node occupies a unique position defined by three coordinates:

- **x_inclination**: East/West tether angle in degrees (-15° to +15°)
- **y_inclination**: North/South tether angle in degrees (-10° to +10°)  
- **z_altitude**: Platform altitude in kilometers above sea level (0-200 km)

## Coordinate Space

### Birthplace (0, 0, z)

Every node has a **birthplace** at:
- `x = 0°` (vertical tether, no East/West inclination)
- `y = 0°` (vertical tether, no North/South inclination)
- `z = variable` (typically 80 km default)

The birthplace is the **default position** if available. The orbital platform is directly above the geographic location.

### Spatial Bounds

| Axis | Range | Resolution | Positions |
|------|-------|-----------|-----------|
| x (E/W) | -15° to +15° | 0.01° | 3,000 |
| y (N/S) | -10° to +10° | 0.01° | 2,000 |
| z (altitude) | 60-120 km | 1 km | 60 |

**Total unique positions**: ~3.6 million

With typical usage (2-10 nodes per region), **utilization is < 0.001%** — space is abundant.

## Why This Design?

### 1. **Spatial Scarcity Without Crowding**

The system creates a **symbolic constraint** (unique positions) while providing **massive practical space**. With only a few nodes per region, you'll never run out of positions.

### 2. **No Extreme Angles Needed**

With 30° × 20° × 60 km of space and low population density, nodes stay within **≤15° inclination** — close to vertical. No need for 45° angles that would look visually stretched.

### 3. **Visual Clustering Around Birthplace**

Nodes naturally cluster near their birthplace `(0, 0, z)`, creating visually meaningful geographic groupings while maintaining unique positions.

## Database Schema

### Columns

```sql
-- 3D Orbital Coordinates (unique per active node)
x_inclination FLOAT DEFAULT 0 CHECK (x_inclination BETWEEN -15 AND 15)
y_inclination FLOAT DEFAULT 0 CHECK (y_inclination BETWEEN -10 AND 10)
z_altitude    FLOAT DEFAULT 80 CHECK (z_altitude BETWEEN 0 AND 200)

-- Geographic Birthplace (not unique, multiple nodes can share a city)
latitude  FLOAT CHECK (latitude BETWEEN -90 AND 90)
longitude FLOAT CHECK (longitude BETWEEN -180 AND 180)
```

### Unique Constraint

```sql
CREATE UNIQUE INDEX idx_unique_orbital_position
  ON graph_nodes (
    ROUND(x_inclination::numeric, 2),
    ROUND(y_inclination::numeric, 2),
    ROUND(z_altitude::numeric, 2)
  )
  WHERE active = true;
```

This ensures **no two active nodes** can occupy the same rounded (x, y, z) position.

## Auto-Assignment Algorithm

The system automatically assigns coordinates using a **spiral search pattern**:

### Strategy

1. **Try birthplace first**: `(0, 0, z_base)`
2. **Spiral outward**: Expand in concentric rings from origin
3. **Vary altitude**: If `(x, y, z)` is occupied, try `z ± 5 km`, `z ± 10 km`, etc.
4. **Stay within bounds**: Never exceed ±15° x, ±10° y, 60-120 km z

### Example Spiral

```
Ring 1: (0, 0, 80)           ← Birthplace (try first)
Ring 2: (1, 0, 80), (0, 1, 80), (-1, 0, 80), (0, -1, 80)
Ring 3: (2, 0, 80), (1, 1, 80), (0, 2, 80), (-1, 1, 80), ...
...
```

If a position is occupied, try altitude variations:
```
(1, 1, 80) occupied → try (1, 1, 85) → try (1, 1, 75) → ...
```

### Code

```javascript
import { assignOrbitalCoordinates } from './utils/orbital-assignment.js';

const coords = await assignOrbitalCoordinates(env, {
  z_base: 80,      // Default altitude
  max_x: 15,       // Max East/West inclination
  max_y: 10,       // Max North/South inclination
});

// Returns: { x_inclination: 0, y_inclination: 0, z_altitude: 80 }
```

## API Endpoints

### Auto-Assign Coordinates

**POST** `/api/orbital/assign/:nodeId`

Automatically assigns the nearest available position to a node.

```bash
curl -X POST https://philosify.org/api/orbital/assign/philosopher_plato \
  -H "Content-Type: application/json" \
  -d '{"z_base": 80}'
```

**Response:**
```json
{
  "success": true,
  "nodeId": "philosopher_plato",
  "coordinates": {
    "x_inclination": 0,
    "y_inclination": 0,
    "z_altitude": 80
  }
}
```

### Manually Set Coordinates

**POST** `/api/orbital/set/:nodeId`

Manually set specific coordinates (with validation and collision detection).

```bash
curl -X POST https://philosify.org/api/orbital/set/philosopher_plato \
  -H "Content-Type: application/json" \
  -d '{
    "x_inclination": 1.5,
    "y_inclination": -0.5,
    "z_altitude": 85
  }'
```

**Response:**
```json
{
  "success": true,
  "nodeId": "philosopher_plato",
  "coordinates": {
    "x_inclination": 1.5,
    "y_inclination": -0.5,
    "z_altitude": 85
  }
}
```

**Error (409 Conflict):**
```json
{
  "error": "Position already occupied",
  "coordinates": { "x_inclination": 1.5, "y_inclination": -0.5, "z_altitude": 85 }
}
```

### Check Position Availability

**GET** `/api/orbital/check?x=1&y=1&z=80`

Check if a specific position is occupied.

```bash
curl "https://philosify.org/api/orbital/check?x=1&y=1&z=80"
```

**Response:**
```json
{
  "coordinates": { "x_inclination": 1, "y_inclination": 1, "z_altitude": 80 },
  "occupied": false
}
```

### Get All Occupied Positions

**GET** `/api/orbital/occupied`

Returns all currently occupied orbital positions.

```bash
curl https://philosify.org/api/orbital/occupied
```

**Response:**
```json
{
  "count": 3,
  "positions": [
    { "x_inclination": 0, "y_inclination": 0, "z_altitude": 80 },
    { "x_inclination": 1, "y_inclination": 0, "z_altitude": 80 },
    { "x_inclination": 0, "y_inclination": 1, "z_altitude": 85 }
  ]
}
```

### Batch Assign

**POST** `/api/orbital/batch-assign`

Assign coordinates to multiple nodes in one transaction.

```bash
curl -X POST https://philosify.org/api/orbital/batch-assign \
  -H "Content-Type: application/json" \
  -d '{
    "nodeIds": ["philosopher_plato", "philosopher_aristotle", "philosopher_socrates"],
    "z_base": 80
  }'
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "assignments": [
    { "node_id": "philosopher_plato", "x_inclination": 0, "y_inclination": 0, "z_altitude": 80 },
    { "node_id": "philosopher_aristotle", "x_inclination": 1, "y_inclination": 0, "z_altitude": 80 },
    { "node_id": "philosopher_socrates", "x_inclination": 0, "y_inclination": 1, "z_altitude": 80 }
  ]
}
```

## Database Functions

### check_orbital_position_occupied

```sql
SELECT check_orbital_position_occupied(1.0, 1.0, 80.0);
-- Returns: true/false
```

### find_nearest_orbital_position

```sql
SELECT * FROM find_nearest_orbital_position(
  p_target_x := 0,
  p_target_y := 0,
  p_target_z := 80,
  p_max_distance := 20
);
-- Returns: (x, y, z, distance) for nearest available position
```

### batch_assign_orbital_coordinates

```sql
SELECT * FROM batch_assign_orbital_coordinates(
  p_node_ids := ARRAY['philosopher_plato', 'philosopher_aristotle'],
  p_z_base := 80
);
-- Returns: assignments for all nodes
```

## Migration

Run the migrations in order:

```bash
# 1. Add columns and indexes
psql -f migrations/add_orbital_coordinates.sql

# 2. Add RPC functions
psql -f migrations/add_orbital_rpc_functions.sql
```

## Visualization

In the frontend 3D graph, coordinates map to:

```javascript
const node = {
  // Geographic birthplace
  birthplaceLat: node.latitude,
  birthplaceLng: node.longitude,
  
  // 3D orbital position
  x: node.x_inclination,        // East/West offset
  y: node.y_inclination,        // North/South offset
  z: node.z_altitude,           // Altitude
};
```

## Examples

### Plato's Academy (Athens)

```javascript
{
  // Geographic birthplace
  latitude: 37.9838,
  longitude: 23.7275,
  
  // Orbital tether position (if alone in region)
  x_inclination: 0,    // Vertical tether
  y_inclination: 0,    // Vertical tether
  z_altitude: 80       // 80 km altitude
}
```

### Multiple Philosophers in Athens

```javascript
// Socrates (first - gets birthplace)
{ latitude: 37.9838, longitude: 23.7275, x: 0, y: 0, z: 80 }

// Plato (second - spirals out)
{ latitude: 37.9838, longitude: 23.7275, x: 1, y: 0, z: 80 }

// Aristotle (third - continues spiral)
{ latitude: 37.9838, longitude: 23.7275, x: 0, y: 1, z: 80 }
```

All share the same **birthplace** (Athens) but occupy **unique orbital positions**.

## Why "Tether"?

The system is inspired by **space tethers** — cables connecting orbital platforms to ground anchors. The inclination angle represents how far the tether deviates from vertical:

- **x = 0°, y = 0°** → Perfectly vertical tether
- **x = 10°, y = 5°** → Tether angled 10° East, 5° North
- **z = 80 km** → Platform altitude

This creates a **physically plausible** but **symbolically flexible** spatial system.

## Performance

- **Unique index**: O(log n) collision detection
- **Spiral search**: O(r²) where r = ring radius (typically r < 5)
- **Batch assignment**: Single transaction, O(n × r²) where n = nodes

For typical use (100s of nodes, low density), assignment completes in < 100ms.

## Future Extensions

### Dynamic Altitude Scaling

Adjust `z_base` by historical importance:

```javascript
const z_base = 60 + (node.weight === 'maximum' ? 40 : 20);
```

### Tradition-Based Clustering

Offset birthplace by philosophical tradition:

```javascript
const x_offset = tradition === 'western' ? 0 : tradition === 'chinese' ? 5 : -5;
```

### Time-Based Z-Axis

Use `year_numeric` for z instead of altitude (temporal dimension):

```javascript
z_altitude: node.year_numeric // -600 BC → z = -600
```

This would create a **spacetime graph** where Z = historical timeline.

---

**Implementation Status**: ✅ Complete  
**Database**: Ready for migration  
**API**: Endpoints registered  
**Tests**: Unit tests included  
**Docs**: This file
