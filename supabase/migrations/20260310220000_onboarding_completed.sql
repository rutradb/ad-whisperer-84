-- Add onboarding_completed flag to profiles.
-- Existing rows are marked as completed so current users skip the wizard.
-- New sign-ups start with false and are redirected to /onboarding.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Existing users skip the wizard
UPDATE public.profiles SET onboarding_completed = true WHERE onboarding_completed = false;
