# Database Schema Files

Database initialization and schema files for Philosify.

## Main Setup

**RUN_THIS_IN_SUPABASE.sql** - Complete database setup (run this first!)

## Schema Files

### Core Tables
- **supabase_credits_schema_fixed.sql** - Credit system tables and RPC functions
- **supabase_email_schema.sql** - Email outbox and logging tables
- **supabase_share_schema.sql** - Sharing and referral system tables
- **supabase_songs_analyses_schema.sql** - Analyses and songs tables

## Initial Setup

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to: **SQL Editor** > **New Query**
4. Copy the contents of **RUN_THIS_IN_SUPABASE.sql**
5. Click **Run**

This will create all necessary tables, functions, policies, and triggers.

## Individual Schemas

If you need to run schemas individually or update specific tables:

```sql
-- Run each schema file separately in SQL Editor
-- Order doesn't matter as they're independent
```

## Schema Overview

```
┌─────────────────────────────────────────┐
│ PHILOSIFY DATABASE STRUCTURE           │
├─────────────────────────────────────────┤
│ user_credits                           │ ← Credits system
│ credit_transactions                    │
│ stripe_webhooks                        │
│                                        │
│ songs                                  │ ← Content
│ analyses                               │
│ song_translations (future)             │
│                                        │
│ shared_analyses                        │ ← Sharing
│ referrals                              │
│                                        │
│ email_outbox                           │ ← Email system
│ email_logs                             │
└─────────────────────────────────────────┘
```

## Notes

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Service role needed for admin operations
- Realtime enabled for credits table
