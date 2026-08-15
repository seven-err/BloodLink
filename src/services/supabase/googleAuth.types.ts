import type { Session, User } from '@supabase/supabase-js';

export type GoogleSignInResult = {
  cancelled?: boolean;
  data: { session: Session | null; user: User | null } | null;
  error: Error | null;
};
