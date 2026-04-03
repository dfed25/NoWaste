/** Set after the user has seen role selection (get-started) so home does not loop redirect. */
export const ONBOARDING_SEEN_KEY = "nw_onboarding_seen";

export function markOnboardingSeen() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
  } catch {
    /* private mode */
  }
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(ONBOARDING_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}
