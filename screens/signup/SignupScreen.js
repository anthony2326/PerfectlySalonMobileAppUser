import { useState, useCallback, useEffect } from "react"
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { StatusBar as ExpoStatusBar } from "expo-status-bar"
import supabase from "../../utils/supabase"
import { CustomModal } from "./components/CustomModal"
import { Step1Personal } from "./steps/Step1Personal"
import { Step2Email } from "./steps/Step2Email"
import { Step3Credentials } from "./steps/Step3Credentials"
import { commonStyles as styles } from "./styles/common.styles"
import { validateEmail, validatePhone, validateUsername, validateAge, validatePassword } from "./utils/validation"
import {
  SIGNUP_STEPS,
  TOTAL_STEPS,
  PASSWORD_MIN_LENGTH,
  PHONE_LENGTH,
  AGE_MIN,
  AGE_MAX,
} from "./utils/constants"

export default function SignupScreen({ onNavigateToLogin, onSignupSuccess }) {
  const [currentStep, setCurrentStep] = useState(SIGNUP_STEPS.PERSONAL_INFO)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [age, setAge] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    buttons: [],
  })

  const showModal = useCallback((title, message, type = "info", buttons = []) => {
    setModalConfig({
      visible: true,
      title,
      message,
      type,
      buttons,
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalConfig((prev) => ({ ...prev, visible: false }))
  }, [])

  const handleStep1Next = () => {
    if (!name.trim()) {
      showModal("Validation Error", "Please enter your full name", "error")
      return
    }

    if (!validateAge(age)) {
      showModal("Validation Error", `Please enter a valid age (${AGE_MIN}-${AGE_MAX})`, "error")
      return
    }

    if (!validatePhone(contactNumber)) {
      showModal("Validation Error", `Please enter a valid ${PHONE_LENGTH}-digit phone number`, "error")
      return
    }

    setCurrentStep(SIGNUP_STEPS.EMAIL_VERIFICATION)
  }

  const handleStep2Next = () => {
    if (!validateEmail(email)) {
      showModal("Validation Error", "Please enter a valid email address", "error")
      return
    }

    if (!isVerified) {
      showModal("Verification Required", "Please verify your email by entering the verification code", "warning")
      return
    }

    setCurrentStep(SIGNUP_STEPS.CREDENTIALS)
  }

  const handleFinalSubmit = async () => {
    if (loading) return

    if (!validateUsername(username)) {
      showModal(
        "Validation Error",
        "Username must be 3-20 characters and contain only letters, numbers, or underscores",
        "error",
      )
      return
    }

    if (!validatePassword(password)) {
      showModal("Validation Error", `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`, "error")
      return
    }

    if (password !== confirmPassword) {
      showModal("Validation Error", "Passwords do not match", "error")
      return
    }

    // Double-check email verification before final submit
    if (!isVerified) {
      showModal("Verification Required", "Please verify your email before creating an account", "error")
      return
    }

    try {
      setLoading(true)

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase().trim())
        .single()

      if (existingProfile) {
        showModal("Error", "An account with this email already exists", "error")
        return
      }

      const { data, error } = await supabase.rpc("register_user", {
        user_email: email.toLowerCase().trim(),
        user_username: username.toLowerCase().trim(),
        user_password: password,
        user_name: name.trim(),
        user_contact_number: contactNumber.replace(/[\s-()]/g, ""),
        user_age: Number.parseInt(age),
      })

      if (error || !data?.[0]?.success) {
        showModal("Registration Failed", error?.message || data?.[0]?.message || "Unable to create account", "error")
        return
      }

      showModal("Success!", "Your account has been created successfully. Please login to continue.", "success", [
        {
          text: "OK",
          onPress: () => {
            setName("")
            setAge("")
            setContactNumber("")
            setEmail("")
            setUsername("")
            setPassword("")
            setConfirmPassword("")
            setVerificationCode("")
            setIsVerified(false)
            setCurrentStep(SIGNUP_STEPS.PERSONAL_INFO)
            onNavigateToLogin()
          },
          style: "primary",
        },
      ])
    } catch (err) {
      console.error("[SIGNUP] Exception:", err)
      showModal("Error", "An unexpected error occurred. Please try again.", "error")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep > SIGNUP_STEPS.PERSONAL_INFO) {
      setCurrentStep(currentStep - 1)
    }
  }

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev)
  }, [])

  const handleLoginNavigation = useCallback(() => {
    if (onNavigateToLogin) {
      onNavigateToLogin()
    }
  }, [onNavigateToLogin])

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(currentStep / TOTAL_STEPS) * 100}%` }]} />
      </View>
      <Text style={styles.progressText}>
        Step {currentStep} of {TOTAL_STEPS}
      </Text>
    </View>
  )

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "top", "bottom"]}>
      <ExpoStatusBar style="auto" translucent={true} />
      <CustomModal
        visible={modalConfig.visible}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        buttons={modalConfig.buttons}
      />
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
                  <Text style={styles.welcomeTitle}>Create Account</Text>
                  <Text style={styles.welcomeSubtitle}>Sign up to book appointments and manage your profile.</Text>
                </View>

                {renderProgressBar()}

                <View style={styles.form}>
                  {currentStep === SIGNUP_STEPS.PERSONAL_INFO && (
                    <Step1Personal
                      name={name}
                      setName={setName}
                      age={age}
                      setAge={setAge}
                      contactNumber={contactNumber}
                      setContactNumber={setContactNumber}
                      onNext={handleStep1Next}
                      loading={loading}
                    />
                  )}
                  {currentStep === SIGNUP_STEPS.EMAIL_VERIFICATION && (
                    <Step2Email
                      email={email}
                      setEmail={setEmail}
                      verificationCode={verificationCode}
                      setVerificationCode={setVerificationCode}
                      isVerified={isVerified}
                      setIsVerified={setIsVerified}
                      onNext={handleStep2Next}
                      onBack={handleBack}
                      loading={loading}
                    />
                  )}
                  {currentStep === SIGNUP_STEPS.CREDENTIALS && (
                    <Step3Credentials
                      username={username}
                      setUsername={setUsername}
                      password={password}
                      setPassword={setPassword}
                      confirmPassword={confirmPassword}
                      setConfirmPassword={setConfirmPassword}
                      showPassword={showPassword}
                      toggleShowPassword={toggleShowPassword}
                      showConfirmPassword={showConfirmPassword}
                      toggleShowConfirmPassword={toggleShowConfirmPassword}
                      onSubmit={handleFinalSubmit}
                      onBack={handleBack}
                      loading={loading}
                    />
                  )}

                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Already have an account? </Text>
                    <TouchableOpacity onPress={handleLoginNavigation} disabled={loading} activeOpacity={0.7}>
                      <Text style={[styles.loginLink, loading && styles.linkDisabled]}>Login</Text>
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