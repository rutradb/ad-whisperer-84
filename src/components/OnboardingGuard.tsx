import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps authenticated routes. Redirects to /onboarding when the user
 * has not yet completed the setup wizard (onboarding_completed = false).
 * Users with no profile row yet (null) also go through onboarding.
 */
export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { profile, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // No profile row yet OR onboarding not completed → redirect to wizard
  if (!profile || profile.onboarding_completed === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
