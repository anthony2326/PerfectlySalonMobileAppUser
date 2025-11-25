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
import { useUser } from "../user context/UserContext"
import { loginScreenStyles as styles } from "./LoginScreenStyles"
import { Eye, EyeOff } from "lucide-react-native"

export default function LoginScreen({ onNavigateToSignup, onNavigateToForgotPassword, onLoginSuccess }) {
  const { login } = useUser()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")

  const isFormValid = useMemo(() => {
    return email.trim().length > 0 && password.trim().length > 0
  }, [email, password])

  const handleEmailChange = useCallback(
    (text) => {
      setEmail(text)
      if (emailError) setEmailError("")
    },
    [emailError]
  )

  const handlePasswordChange = useCallback(
    (text) => {
      setPassword(text)
      if (passwordError) setPasswordError("")
    },
    [passwordError]
  )

  const validateForm = () => {
    let isValid = true

    if (!email.trim()) {
      setEmailError("Email or username is required")
      isValid = false
    }

    if (!password.trim()) {
      setPasswordError("Password is required")
      isValid = false
    }

    return isValid
  }

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      console.log("[LOGIN] Attempting to login user:", email)

      const { data, error } = await supabase.rpc("login_user", {
        user_identifier: email.toLowerCase().trim(),
        user_password: password,
      })

      if (error) {
        console.error("[LOGIN] Supabase Error:", error)
        Alert.alert("Login Failed", error.message || "An error occurred during login")
        return
      }

      if (!data || data.length === 0) {
        setEmailError("Invalid credentials")
        setPasswordError("Invalid credentials")
        Alert.alert(
          "Login Failed",
          "Invalid credentials. Please check your email/username and password."
        )
        return
      }

      const result = data[0]

      if (!result.success) {
        Alert.alert("Login Failed", result.message || "Invalid credentials")
        return
      }

      if (!result.user_id) {
        Alert.alert("Login Failed", "User account not found")
        return
      }

      const userData = {
        id: result.user_id,
        email: result.user_email,
        username: result.user_username,
        name: result.user_name,
        contactNumber: result.user_contact_number,
        age: result.user_age,
        isVerified: result.is_verified || false,
      }

      login(userData)

      if (onLoginSuccess) {
        onLoginSuccess(userData)
      }

      Alert.alert("Welcome Back! 🎉", `Hello ${result.user_name}, you're now logged in.`)
      
    } catch (err) {
      console.error("[LOGIN] Exception:", err)
      Alert.alert("Error", "An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [email, password, login, onLoginSuccess])

  const toggleRememberMe = useCallback(() => {
    setRememberMe((prev) => !prev)
  }, [])

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const handleSignupNavigation = useCallback(() => {
    if (onNavigateToSignup) {
      onNavigateToSignup()
    }
  }, [onNavigateToSignup])

  const handleForgotPasswordNavigation = useCallback(() => {
    if (onNavigateToForgotPassword) {
      onNavigateToForgotPassword()
    }
  }, [onNavigateToForgotPassword])

  const CustomCheckbox = useCallback(
    ({ checked, onPress }) => (
      <TouchableOpacity
        onPress={onPress}
        style={styles.checkboxContainer}
        disabled={loading}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    ),
    [loading]
  )

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top", "bottom"]}>
      <ExpoStatusBar style="auto" translucent={true} />
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
                  <Text style={styles.welcomeTitle}>Welcome</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Login to book appointments and manage your profile.
                  </Text>
                </View>

                <View style={styles.form}>
                  {/* Email Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email or Username</Text>
                    <TextInput
                      style={[styles.input, emailError && styles.inputError]}
                      value={email}
                      onChangeText={handleEmailChange}
                      placeholder="Enter email or username"
                      placeholderTextColor="#999"
                      autoCapitalize="none"
                      editable={!loading}
                      keyboardType="email-address"
                      maxLength={100}
                    />
                    {emailError && <Text style={styles.errorText}>{emailError}</Text>}
                  </View>

                  {/* Password Input */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View
                      style={[
                        styles.passwordContainer,
                        passwordError && styles.passwordContainerError,
                      ]}
                    >
                      <TextInput
                        style={styles.passwordInput}
                        value={password}
                        onChangeText={handlePasswordChange}
                        placeholder="Enter your password"
                        placeholderTextColor="#999"
                        secureTextEntry={!showPassword}
                        editable={!loading}
                        maxLength={100}
                      />
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={toggleShowPassword}
                        disabled={loading}
                        activeOpacity={0.6}
                      >
                        {showPassword ? (
                          <Eye size={18} color="#e91e63" />
                        ) : (
                          <EyeOff size={18} color="#999" />
                        )}
                      </TouchableOpacity>
                    </View>
                    {passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                  </View>

                  {/* Remember me & Forgot password */}
                  <View style={styles.formOptions}>
                    <View style={styles.rememberMeContainer}>
                      <CustomCheckbox checked={rememberMe} onPress={toggleRememberMe} />
                      <Text style={styles.rememberMeText}>Remember Me</Text>
                    </View>
                    <TouchableOpacity 
                      disabled={loading} 
                      activeOpacity={0.7}
                      onPress={handleForgotPasswordNavigation}
                    >
                      <Text
                        style={[styles.forgotPassword, loading && styles.linkDisabled]}
                      >
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Login Button */}
                  <TouchableOpacity
                    style={[styles.signInButton, loading && styles.signInButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#ffffff" size="small" />
                        <Text style={styles.loadingText}>Logging in...</Text>
                      </View>
                    ) : (
                      <Text style={styles.signInButtonText}>Login</Text>
                    )}
                  </TouchableOpacity>

                  {/* Signup Link */}
                  <View style={styles.signUpContainer}>
                    <Text style={styles.signUpText}>Don't have an account? </Text>
                    <TouchableOpacity
                      onPress={handleSignupNavigation}
                      disabled={loading}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.signUpLink, loading && styles.linkDisabled]}
                      >
                        Create one
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  )
}