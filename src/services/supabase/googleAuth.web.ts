import type { GoogleSignInResult } from './googleAuth.types';
import { signInWithGoogleOAuth } from './googleAuthOAuth';

export type { GoogleSignInResult } from './googleAuth.types';

/** Browser OAuth on web. */
export const signInWithGooglePlatform = (): Promise<GoogleSignInResult> =>
  signInWithGoogleOAuth();

export const signOutGooglePlatform = async () => {
  // No native Google session on web.
};
