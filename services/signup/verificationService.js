// mobile/services/signup/verificationService.js

import supabase from "../../utils/supabase" // Default import to match supabase.js export

export const verificationService = {
  /**
   * Send verification code to email
   * @param {string} email - User's email address
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  sendVerificationCode: async (email) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-verification-code", {
        body: { email },
      })

      if (error) {
        console.error("Send verification code error:", error)
        return {
          success: false,
          error: error.message || "Failed to send verification code",
        }
      }

      return {
        success: true,
      }
    } catch (error) {
      console.error("Send verification code exception:", error)
      return {
        success: false,
        error: error.message || "An error occurred while sending verification code",
      }
    }
  },

  /**
   * Verify the code entered by user
   * @param {string} email - User's email address
   * @param {string} code - 6-digit verification code
   * @returns {Promise<{verified: boolean, error?: string}>}
   */
  verifyCode: async (email, code) => {
    try {
      const { data, error } = await supabase.functions.invoke("verify-code", {
        body: { email, code },
      })

      if (error) {
        console.error("Verify code error:", error)
        return {
          verified: false,
          error: error.message || "Failed to verify code",
        }
      }

      if (data && data.verified) {
        return {
          verified: true,
        }
      }

      return {
        verified: false,
        error: data?.error || "Invalid verification code",
      }
    } catch (error) {
      console.error("Verify code exception:", error)
      return {
        verified: false,
        error: error.message || "An error occurred while verifying code",
      }
    }
  },

  /**
   * Keep edge functions alive
   * @returns {Promise<void>}
   */
  keepAlive: async () => {
    try {
      await supabase.functions.invoke("keep-alive")
    } catch (error) {
      console.error("Keep-alive error:", error)
    }
  },
}