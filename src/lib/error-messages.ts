/**
 * Maps raw API / Supabase / platform error strings to user-friendly messages.
 * Always returns a safe, non-technical string suitable for display in the UI.
 */

const ERROR_MAP: Record<string, string> = {
  // Auth
  'Invalid login credentials':         'Incorrect email or password.',
  'Email not confirmed':               'Please verify your email before signing in.',
  'User already registered':           'An account with this email already exists.',
  'email rate limit exceeded':         'Too many sign-up attempts. Please try again in a few minutes.',
  'over_email_send_rate_limit':        'Too many sign-up attempts. Please try again in a few minutes.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'Token has expired or is invalid':   'Your session has expired. Please sign in again.',
  'JWT expired':                       'Your session has expired. Please sign in again.',
  'Not authenticated':                 'You must be signed in to do this.',

  // Organisation / permissions
  'No organization found':             'No workspace found for your account.',
  'Only owners and admins':            'You don\'t have permission to perform this action.',
  'Only owners can change member roles': 'Only workspace owners can change member roles.',

  // Network / server
  'Failed to fetch':                   'Network error — please check your connection.',
  'NetworkError':                       'Network error — please check your connection.',
  '500':                               'Server error — please try again in a moment.',
  '502':                               'Service temporarily unavailable. Please retry.',
  '503':                               'Service temporarily unavailable. Please retry.',
  '429':                               'Too many requests — please wait a moment and retry.',

  // Ad platform OAuth
  'oauth_failed':                      'Could not connect your ad account. Please try again.',
  'invalid_grant':                     'Your ad platform session has expired. Please reconnect.',
  'access_denied':                     'Access was denied by the ad platform.',

  // Campaign / budget
  'Invalid campaign ID':               'Campaign not found.',
  'Budget must be greater than 0':     'Daily budget must be greater than $0.',
  'Campaign not found':                'This campaign no longer exists.',

  // Reports / export
  'Export timed out':                  'Report generation timed out. Try a shorter date range.',

  // Sync
  'Sync already in progress':          'A sync is already running — please wait for it to finish.',

  // Avatar / profile
  'Invalid avatar URL':                'The uploaded image could not be saved. Please try again.',
  'File must be under 5 MB':           'Profile picture must be under 5 MB.',
};

/**
 * Returns a user-friendly error message for the given raw error string.
 * Falls back to a generic message if no specific mapping exists.
 */
export function getUserFriendlyError(raw: string | null | undefined): string {
  if (!raw) return 'Something went wrong. Please try again.';

  // Exact match first
  if (ERROR_MAP[raw]) return ERROR_MAP[raw];

  // Substring / partial match
  for (const [pattern, friendly] of Object.entries(ERROR_MAP)) {
    if (raw.toLowerCase().includes(pattern.toLowerCase())) {
      return friendly;
    }
  }

  // Generic fallback — avoid leaking technical details
  return 'Something went wrong. Please try again.';
}
