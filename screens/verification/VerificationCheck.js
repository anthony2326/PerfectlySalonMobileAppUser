// utils/verificationCheck.js
import { Alert } from 'react-native';

/**
 * Checks if user is verified and shows appropriate message
 * @param {Object} userData - User data object with is_verified field
 * @param {Function} onVerified - Callback to execute if user is verified
 * @returns {boolean} - Returns true if verified, false otherwise
 */
export const checkUserVerification = (userData, onVerified = null) => {
  if (!userData) {
    Alert.alert(
      "Authentication Required",
      "Please log in to access this feature.",
      [{ text: "OK" }]
    );
    return false;
  }

  if (userData.is_verified !== true) {
    Alert.alert(
      "Verification Required",
      "Your account is pending verification by our admin team. You'll be able to book appointments once your account is approved.",
      [
        { 
          text: "OK",
          style: "default"
        }
      ]
    );
    return false;
  }

  // User is verified, execute callback if provided
  if (onVerified) {
    onVerified();
  }
  
  return true;
};

/**
 * Web version for React (Clients.jsx style)
 */
export const checkUserVerificationWeb = (userData) => {
  if (!userData) {
    alert("Please log in to access this feature.");
    return false;
  }

  if (userData.is_verified !== true) {
    alert("Your account is pending verification. You'll be able to book appointments once approved by our admin team.");
    return false;
  }

  return true;
};