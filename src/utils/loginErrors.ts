export const getLoginErrorMessage = (message: string) => {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('email not confirmed')) {
    return 'Confirm your email before logging in. Check your inbox for the verification link, then try again.';
  }

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }

  if (normalized.includes('email logins are disabled')) {
    return 'Email login is temporarily unavailable. Please try again later or contact support.';
  }

  if (
    normalized.includes('native module is null') ||
    normalized.includes('asyncstorageerror') ||
    normalized.includes('auto refresh tick failed')
  ) {
    return 'We could not save your session on this device. Restart the app and try again. If this keeps happening, reinstall the Expo Go app or run npm install in the project.';
  }

  return message;
};
