import { useState, useCallback, useMemo } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import supabase from "../../utils/supabase"
import { forgotPasswordStyles as styles } from "./ForgotPasswordStyle"
import { Eye, EyeOff, ArrowLeft } from "lucide-react-native"
import { validateEmail, validatePassword } from "../../screens/signup/utils/validation"
import { VERIFICATION_CODE_LENGTH, PASSWORD_MIN_LENGTH, COLORS } from "../../screens/signup/utils/constants"

export default function ForgotPasswordScreen({ onNavigateToLogin }) {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [otpError, setOtpError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [userId, setUserId] = useState(null)

  const handleEmailChange = useCallback((text) => {
    setEmail(text)
    if (emailError) setEmailError("")
  }, [emailError])

  const handleOtpChange = useCallback((text) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, "")
    setOtp(numericText)
    if (otpError) setOtpError("")
  }, [otpError])

  const handleNewPasswordChange = useCallback((text) => {
    setNewPassword(text)
    if (passwordError) setPasswordError("")
  }, [passwordError])

  const handleConfirmPasswordChange = useCallback((text) => {
    setConfirmPassword(text)
    if (confirmPasswordError) setConfirmPasswordError("")
  }, [confirmPasswordError])

  const handleSendOTP = useCallback(async () => {
    if (!email.trim()) {
      setEmailError("Email is required")
      return
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address")
      return
    }

    try {
      setLoading(true)
      console.log("[FORGOT PASSWORD] Checking email and sending OTP:", email)

      // Check if email exists in users table (use maybeSingle to avoid error when no rows found)
      const { data: userData, error: checkError } = await supabase
        .from("users")
        .select("id, email, username, name, is_blocked")
        .eq("email", email.toLowerCase().trim())
        .maybeSingle()

      // Check if email was not found (userData will be null if no match)
      if (!userData) {
        console.log("[FORGOT PASSWORD] Email not found in database")
        setEmailError("This email is not registered with us")
        Alert.alert(
          "Email Not Found", 
          "This email address is not registered in our system. Please check your email or create a new account."
        )
        return
      }

      // Check for other database errors
      if (checkError) {
        console.error("[FORGOT PASSWORD] Database error:", checkError)
        Alert.alert("Error", "Failed to verify email. Please try again.")
        return
      }

      // Check if user is blocked
      if (userData.is_blocked) {
        setEmailError("Account is blocked")
        Alert.alert(
          "Account Blocked",
          "Your account has been blocked. Please contact support for assistance."
        )
        return
      }

      console.log("[FORGOT PASSWORD] Email found, sending OTP via edge function")
      setUserId(userData.id)

      // Call your existing send-verification-code edge function
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'send-verification-code',
        {
          body: { email: email.toLowerCase().trim() }
        }
      )

      if (functionError) {
        console.error("[FORGOT PASSWORD] Edge function error:", functionError)
        Alert.alert("Error", "Failed to send verification code. Please try again.")
        return
      }

      if (!functionData?.success) {
        console.error("[FORGOT PASSWORD] Function returned error:", functionData?.error)
        Alert.alert("Error", functionData?.error || "Failed to send verification code.")
        return
      }

      Alert.alert(
        "OTP Sent! 📧",
        `A ${VERIFICATION_CODE_LENGTH}-digit verification code has been sent to ${email.toLowerCase().trim()}. Please check your email inbox.`
      )
      setStep(2)
    } catch (err) {
      console.error("[FORGOT PASSWORD] Exception:", err)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [email])

  const handleVerifyOTP = useCallback(async () => {
    if (!otp.trim()) {
      setOtpError("OTP code is required")
      return
    }

    if (otp.trim().length !== VERIFICATION_CODE_LENGTH) {
      setOtpError(`OTP must be ${VERIFICATION_CODE_LENGTH} digits`)
      return
    }

    try {
      setLoading(true)
      console.log("[FORGOT PASSWORD] Verifying OTP via edge function")

      // Call your existing verify-code edge function
      const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
        'verify-code',
        {
          body: { 
            email: email.toLowerCase().trim(),
            code: otp.trim()
          }
        }
      )

      if (verifyError) {
        console.error("[FORGOT PASSWORD] Verify edge function error:", verifyError)
        setOtpError("Failed to verify code")
        Alert.alert("Error", "Failed to verify code. Please try again.")
        return
      }

      if (!verifyData?.verified) {
        console.error("[FORGOT PASSWORD] Verification failed:", verifyData?.error)
        setOtpError(verifyData?.error || "Invalid verification code")
        Alert.alert(
          "Verification Failed", 
          verifyData?.error || "Invalid or expired OTP code. Please try again or request a new code."
        )
        return
      }

      Alert.alert("Success! ✅", "OTP verified. Please enter your new password.")
      setStep(3)
    } catch (err) {
      console.error("[FORGOT PASSWORD] Exception:", err)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [email, otp])

  const handleResetPassword = useCallback(async () => {
    let isValid = true

    if (!newPassword.trim()) {
      setPasswordError("New password is required")
      isValid = false
    } else if (!validatePassword(newPassword)) {
      setPasswordError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
      isValid = false
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError("Please confirm your password")
      isValid = false
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match")
      isValid = false
    }

    if (!isValid) return

    try {
      setLoading(true)
      console.log("[FORGOT PASSWORD] Resetting password for user:", userId)

      // Use SQL function to hash and update password in one transaction
      const { data: resetData, error: resetError } = await supabase.rpc('reset_password', {
        p_user_id: userId,
        p_new_password: newPassword
      })

      if (resetError) {
        console.error("[FORGOT PASSWORD] Reset error:", resetError)
        Alert.alert("Error", "Failed to reset password. Please try again.")
        return
      }

      if (!resetData || resetData.length === 0) {
        Alert.alert("Error", "Failed to reset password. Please try again.")
        return
      }

      const result = resetData[0]
      if (!result.success) {
        Alert.alert("Error", result.message || "Failed to reset password.")
        return
      }

      // Delete the verification record after successful password reset
      await supabase
        .from("email_verifications")
        .delete()
        .eq("email", email.toLowerCase().trim())

      console.log("[FORGOT PASSWORD] Password reset completed successfully")

      Alert.alert(
        "Password Reset Successful! 🎉",
        "Your password has been updated successfully. Please login with your new password.",
        [
          {
            text: "OK",
            onPress: () => {
              if (onNavigateToLogin) {
                onNavigateToLogin()
              }
            }
          }
        ]
      )
    } catch (err) {
      console.error("[FORGOT PASSWORD] Exception:", err)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [userId, email, newPassword, confirmPassword, onNavigateToLogin])

  const handleBack = useCallback(() => {
    if (step === 1) {
      if (onNavigateToLogin) {
        onNavigateToLogin()
      }
    } else if (step === 2) {
      Alert.alert(
        "Go Back?",
        "Are you sure you want to go back? You'll need to request a new OTP.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Yes",
            onPress: () => {
              setStep(1)
              setOtp("")
              setOtpError("")
            }
          }
        ]
      )
    } else if (step === 3) {
      Alert.alert(
        "Go Back?",
        "Are you sure you want to go back? Your OTP will remain valid.",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Yes",
            onPress: () => {
              setStep(2)
              setNewPassword("")
              setConfirmPassword("")
              setPasswordError("")
              setConfirmPasswordError("")
            }
          }
        ]
      )
    }
  }, [step, onNavigateToLogin])

  const toggleShowNewPassword = useCallback(() => {
    setShowNewPassword((prev) => !prev)
  }, [])

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev)
  }, [])

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top", "bottom"]}>
      <ExpoStatusBar style="light" translucent={true} />
      <LinearGradient
        colors={["#c85878", "#d96b8c", "#c85878"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
          keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 20}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              <View style={styles.card}>
                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={24} color="#e91e63" />
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

                <View style={styles.header}>
                  <View style={styles.logoContainer}>
                    <Text style={styles.brandText}>Perfectly Salon</Text>
                    <View style={styles.logoCircle}>
                      <Image
                        source={require("../../assets/logo-salon.jpg")}
                        style={styles.logoImage}
                        resizeMode="cover"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.welcomeSection}>
                  <Text style={styles.welcomeTitle}>
                    {step === 1 && "Forgot Password?"}
                    {step === 2 && "Verify OTP"}
                    {step === 3 && "Reset Password"}
                  </Text>
                  <Text style={styles.welcomeSubtitle}>
                    {step === 1 && "Enter your registered email to receive a verification code"}
                    {step === 2 && `Enter the ${VERIFICATION_CODE_LENGTH}-digit code sent to your email`}
                    {step === 3 && "Create a new password for your account"}
                  </Text>
                </View>

                <View style={styles.form}>
                  {/* Step 1: Email Input */}
                  {step === 1 && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <TextInput
                          style={[styles.input, emailError && styles.inputError]}
                          value={email}
                          onChangeText={handleEmailChange}
                          placeholder="Enter your registered email"
                          placeholderTextColor="#999"
                          autoCapitalize="none"
                          editable={!loading}
                          keyboardType="email-address"
                          maxLength={100}
                        />
                        {emailError && <Text style={styles.errorText}>{emailError}</Text>}
                      </View>

                      <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleSendOTP}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#ffffff" size="small" />
                            <Text style={styles.loadingText}>Sending OTP...</Text>
                          </View>
                        ) : (
                          <Text style={styles.submitButtonText}>Send OTP</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Step 2: OTP Input */}
                  {step === 2 && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Verification Code</Text>
                        <TextInput
                          style={[styles.input, otpError && styles.inputError, styles.otpInput]}
                          value={otp}
                          onChangeText={handleOtpChange}
                          placeholder={`Enter ${VERIFICATION_CODE_LENGTH}-digit code`}
                          placeholderTextColor="#999"
                          editable={!loading}
                          keyboardType="number-pad"
                          maxLength={VERIFICATION_CODE_LENGTH}
                        />
                        {otpError && <Text style={styles.errorText}>{otpError}</Text>}
                        <Text style={styles.otpHint}>Code sent to: {email}</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.resendButton}
                        onPress={handleSendOTP}
                        disabled={loading}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.resendText, loading && styles.linkDisabled]}>
                          Resend OTP
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleVerifyOTP}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#ffffff" size="small" />
                            <Text style={styles.loadingText}>Verifying...</Text>
                          </View>
                        ) : (
                          <Text style={styles.submitButtonText}>Verify OTP</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}

                  {/* Step 3: New Password Input */}
                  {step === 3 && (
                    <>
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>New Password</Text>
                        <View
                          style={[
                            styles.passwordContainer,
                            passwordError && styles.passwordContainerError,
                          ]}
                        >
                          <TextInput
                            style={styles.passwordInput}
                            value={newPassword}
                            onChangeText={handleNewPasswordChange}
                            placeholder={`Min. ${PASSWORD_MIN_LENGTH} characters`}
                            placeholderTextColor="#999"
                            secureTextEntry={!showNewPassword}
                            editable={!loading}
                            maxLength={100}
                          />
                          <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={toggleShowNewPassword}
                            disabled={loading}
                            activeOpacity={0.6}
                          >
                            {showNewPassword ? (
                              <Eye size={18} color="#e91e63" />
                            ) : (
                              <EyeOff size={18} color="#999" />
                            )}
                          </TouchableOpacity>
                        </View>
                        {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                      </View>

                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Confirm New Password</Text>
                        <View
                          style={[
                            styles.passwordContainer,
                            confirmPasswordError && styles.passwordContainerError,
                          ]}
                        >
                          <TextInput
                            style={styles.passwordInput}
                            value={confirmPassword}
                            onChangeText={handleConfirmPasswordChange}
                            placeholder="Re-enter new password"
                            placeholderTextColor="#999"
                            secureTextEntry={!showConfirmPassword}
                            editable={!loading}
                            maxLength={100}
                          />
                          <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={toggleShowConfirmPassword}
                            disabled={loading}
                            activeOpacity={0.6}
                          >
                            {showConfirmPassword ? (
                              <Eye size={18} color="#e91e63" />
                            ) : (
                              <EyeOff size={18} color="#999" />
                            )}
                          </TouchableOpacity>
                        </View>
                        {confirmPasswordError && (
                          <Text style={styles.errorText}>{confirmPasswordError}</Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                        activeOpacity={0.8}
                      >
                        {loading ? (
                          <View style={styles.loadingContainer}>
                            <ActivityIndicator color="#ffffff" size="small" />
                            <Text style={styles.loadingText}>Resetting Password...</Text>
                          </View>
                        ) : (
                          <Text style={styles.submitButtonText}>Reset Password</Text>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}