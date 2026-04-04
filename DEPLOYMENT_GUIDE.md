# Orbital Coordinates Deployment Guide

## Step 1: Apply Database Migrations

Go to **Supabase SQL Editor**: https://supabase.com/dashboard → Your Project → SQL Editor

### 1.1 Run Migration 1 (Add Columns)

Copy and paste the entire contents of:
```
migrations/add_orbital_coordinates.sql
```

Click **Run** or press `Ctrl+Enter`

Expected output: `Success. No rows returned`

### 1.2 Run Migration 2 (Add Functions)

Copy and paste the entire contents of:
```
migrations/add_orbital_rpc_functions.sql
```

Click **Run** or press `Ctrl+Enter`

Expected output: `Success. No rows returned`

### 1.3 Verify Installation

Run this query in SQL Editor:

```sql
-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'graph_nodes'
AND column_name IN ('x_inclination', 'y_inclination', 'z_altitude', 'latitude', 'longitude');
```

Expected output: 5 rows showing the new columns

```sql
-- Check if functions were created
SELECT routine_name 
FROM information_schema.routines
WHERE routine_name LIKE '%orbital%';
```

Expected output: 4 functions (check_orbital_position_occupied, get_occupied_orbital_positions, find_nearest_orbital_position, batch_assign_orbital_coordinates)

## Step 2: Deploy API

### 2.1 Commit Changes

```bash
cd api
git add .
git commit -m "Add 3D orbital coordinate system for History Graph"
```

### 2.2 Deploy to Production

```bash
npm run deploy:prod
```

This will deploy to `api.philosify.org`

### 2.3 Verify API Endpoints

Test the new endpoints:

```bash
# Check occupied positions (should return empty array initially)
curl https://api.philosify.org/api/orbital/occupied

# Auto-assign coordinates to a test node
curl -X POST https://api.philosify.org/api/orbital/assign/philosopher_plato \
  -H "Content-Type: application/json" \
  -d '{"z_base": 80}'
```

## Step 3: Push to Git (All Branches)

```bash
cd ..
git push origin development
git push origin main  
git push origin production
```

## Step 4: Test the System

### 4.1 Check History Graph API

```bash
curl https://api.philosify.org/api/history/graph | jq '.nodes[0]'
```

Should now include `x_inclination`, `y_inclination`, `z_altitude` fields

### 4.2 Assign Coordinates to Existing Nodes

```bash
# Get all philosopher IDs
curl https://api.philosify.org/api/history/graph | \
  jq -r '.nodes[] | select(.type=="philosopher") | .id' | \
  head -10 > philosopher_ids.txt

# Batch assign (example with first 3)
curl -X POST https://api.philosify.org/api/orbital/batch-assign \
  -H "Content-Type: application/json" \
  -d '{
    "nodeIds": [
      "philosopher_plato",
      "philosopher_aristotle",
      "philosopher_socrates"
    ],
    "z_base": 80
  }'
```

## Troubleshooting

### Migration Fails

If you get an error about `graph_nodes` not existing:
- The table hasn't been created yet
- Run the `history_graph_tables.sql` migration first

### API Endpoints Return 404

- Make sure you deployed with `npm run deploy:prod` in the `api/` directory
- Check `wrangler.toml` has the routes configured
- Verify deployment: `wrangler deployments list --env production`

### Coordinates Not Showing in Graph Response

- Check the API actually deployed: `curl https://api.philosify.org/api/history/graph | jq '.nodes[0] | keys'`
- Should include: `x_inclination`, `y_inclination`, `z_altitude`

## Rollback (if needed)

### Remove Columns

```sql
ALTER TABLE graph_nodes 
  DROP COLUMN IF EXISTS x_inclination,
  DROP COLUMN IF EXISTS y_inclination,
  DROP COLUMN IF EXISTS z_altitude,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS longitude;
```

### Remove Functions

```sql
DROP FUNCTION IF EXISTS check_orbital_position_occupied;
DROP FUNCTION IF EXISTS get_occupied_orbital_positions;
DROP FUNCTION IF EXISTS find_nearest_orbital_position;
DROP FUNCTION IF EXISTS batch_assign_orbital_coordinates;
```

---

**Estimated Time**: 15 minutes  
**Downtime**: None (migrations are non-breaking)  
**Risk Level**: Low (only adds new columns/functions, doesn't modify existing data)
