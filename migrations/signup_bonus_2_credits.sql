-- ============================================================
-- MIGRATION: Signup bonus 10 -> 2 free credits
-- ============================================================
-- Run in Supabase dashboard SQL Editor.
-- Replaces handle_new_user() so new signups receive 2 free credits
-- (previously 10). Existing users' balances are NOT changed.
--
-- IMPORTANT: the GRANT at the bottom is required — it is lost every
-- time CREATE OR REPLACE FUNCTION runs, and signup breaks without it.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile (with display_name from auth metadata)
  INSERT INTO public.profiles (user_id, email, display_name, preferred_language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    updated_at = NOW();

  -- Create credits record (2 free credits for new users)
  INSERT INTO public.credits (user_id, purchased, free_remaining)
  VALUES (NEW.id, 0, 2)
  ON CONFLICT (user_id) DO NOTHING;

  -- Log signup bonus
  INSERT INTO public.credit_history (
    user_id,
    type,
    amount,
    purchased_before, purchased_after,
    free_before, free_after,
    total_before, total_after,
    status
  ) VALUES (
    NEW.id,
    'signup_bonus',
    2,
    0, 0,
    0, 2,
    0, 2,
    'completed'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRITICAL: re-grant execute (lost on CREATE OR REPLACE; signup fails without it)
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;
