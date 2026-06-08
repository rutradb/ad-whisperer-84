
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- user_tokens
DROP POLICY IF EXISTS "Users can select own token" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can insert own token" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can update own token" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can delete own token" ON public.user_tokens;

CREATE POLICY "Users can select own token" ON public.user_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own token" ON public.user_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own token" ON public.user_tokens FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own token" ON public.user_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- automated_rules
DROP POLICY IF EXISTS "Users can select own rules" ON public.automated_rules;
DROP POLICY IF EXISTS "Users can insert own rules" ON public.automated_rules;
DROP POLICY IF EXISTS "Users can update own rules" ON public.automated_rules;
DROP POLICY IF EXISTS "Users can delete own rules" ON public.automated_rules;

CREATE POLICY "Users can select own rules" ON public.automated_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON public.automated_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.automated_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.automated_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- copy_history
DROP POLICY IF EXISTS "Users can view own copy history" ON public.copy_history;
DROP POLICY IF EXISTS "Users can insert own copy history" ON public.copy_history;
DROP POLICY IF EXISTS "Users can delete own copy history" ON public.copy_history;

CREATE POLICY "Users can view own copy history" ON public.copy_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own copy history" ON public.copy_history FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own copy history" ON public.copy_history FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Attach handle_new_user trigger (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;
