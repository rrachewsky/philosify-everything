# Admin Scripts

Administrative utilities for managing the Philosify system.

## Credit Management

### Add Credits
- **add-10-credits.js** - Add 10 credits to a user account
- **direct-add-50-credits.js** - Directly add 50 credits (bypasses Stripe)
- **manually-add-50-credits.js** - Manually add 50 credits to user

### Fix/Adjust Credits
- **fix-claueppinger-credits.js** - Fix specific user credit issue

## User Management

### User Queries
- **check-auth-user.js** - Check user authentication status
- **check-current-user.js** - Display current user information
- **check-user-credits.js** - Check user credit balance
- **list-all-users.js** - List all users in the system

### User Operations
- **initialize-user.js** - Initialize new user with default credits

## SQL Scripts

### Database Modifications
- **add_refund_function.sql** - Add refund RPC function to database
- **enable_realtime_credits.sql** - Enable realtime subscriptions for credits
- **fix_payment_permissions.sql** - Fix payment-related database permissions
- **supabase_add_analyses_columns.sql** - Add columns to analyses table
- **supabase_add_email_logs.sql** - Add email logging table
- **supabase_add_refund_rpc.sql** - Add refund RPC procedures
- **supabase_add_signup_trigger.sql** - Add user signup trigger

### Running SQL Scripts
Execute in Supabase SQL Editor:
```sql
-- Copy contents of SQL file and run in:
-- Supabase Dashboard > SQL Editor > New Query
```

## Usage

All scripts require Supabase credentials. Run from project root:

```bash
node admin/script-name.js
```

**Note:** These are administrative tools. Use with caution in production.

