/**
 * Narrow re-export of @react-native-google-signin/google-signin.
 * The package entry also exports GoogleSigninButton, whose native codegen
 * module breaks Metro resolution in Expo. We only need the sign-in API.
 */
export { GoogleSignin } from '../../node_modules/@react-native-google-signin/google-signin/lib/module/signIn/GoogleSignin.js';
export { statusCodes } from '../../node_modules/@react-native-google-signin/google-signin/lib/module/errors/errorCodes.js';
export {
  isCancelledResponse,
  isErrorWithCode,
  isSuccessResponse,
} from '../../node_modules/@react-native-google-signin/google-signin/lib/module/functions.js';
