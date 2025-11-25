import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native"
import { step2Styles as styles } from "../styles/step2.styles"
import { ArrowLeft } from "lucide-react-native"
import { VERIFICATION_CODE_LENGTH } from "../utils/constants"
import { useState, useEffect } from "react"
import { verificationService } from "../../../services/signup/verificationService"
import { VerificationModal } from "../components/VerificationModal"

export const Step2Email = ({
  email,
  setEmail,
  verificationCode,
  setVerificationCode,
  isVerified,
  setIsVerified,
  onNext,
  onBack,
  loading,
}) => {
  const [sendingCode, setSendingCode] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [codeSent, setCodeSent] = useState(false)
  const [modalConfig, setModalConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  })

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Auto-verify when 6 digits entered - ONLY if code was sent
  useEffect(() => {
    if (verificationCode.length === VERIFICATION_CODE_LENGTH && !isVerified && !verifying && codeSent) {
      handleVerifyCode()
    }
  }, [verificationCode, isVerified, verifying, codeSent])

  const showModal = (title, message, type = "info") => {
    setModalConfig({
      visible: true,
      title,
      message,
      type,
    })
  }

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, visible: false }))
  }

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      showModal("Invalid Email", "Please enter a valid email address", "error")
      return
    }

    setSendingCode(true)
    const result = await verificationService.sendVerificationCode(email)
    setSendingCode(false)

    if (result.success) {
      setCodeSent(true)
      setCountdown(60)
      setIsVerified(false)
      setVerificationCode("")
      showModal("Code Sent", "Verification code sent to your email. Please check your inbox.", "success")
    } else {
      showModal("Error", result.error || "Failed to send verification code", "error")
    }
  }

  const handleVerifyCode = async () => {
    if (verificationCode.length !== VERIFICATION_CODE_LENGTH) {
      return
    }

    if (!codeSent) {
      showModal("Error", "Please request a verification code first", "error")
      return
    }

    setVerifying(true)
    const result = await verificationService.verifyCode(email, verificationCode)
    setVerifying(false)

    if (result.verified) {
      setIsVerified(true)
      showModal("Verified", "Email verified successfully!", "success")
    } else {
      setVerificationCode("")
      setIsVerified(false)
      // Show user-friendly error message
      const friendlyError = result.error?.includes("FunctionsHttpError") || result.error?.includes("Edge Function")
        ? "Invalid or expired verification code. Please try again."
        : result.error || "Invalid or expired verification code. Please try again."
      showModal("Verification Failed", friendlyError, "error")
    }
  }

  const handleManualVerify = () => {
    if (!codeSent) {
      showModal("Error", "Please request a verification code first", "error")
      return
    }
    if (verificationCode.length !== VERIFICATION_CODE_LENGTH) {
      showModal("Error", "Please enter a 6-digit verification code", "error")
      return
    }
    handleVerifyCode()
  }

  return (
    <>
      <VerificationModal
        visible={modalConfig.visible}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={(text) => {
            setEmail(text)
            if (codeSent) {
              setCodeSent(false)
              setIsVerified(false)
              setVerificationCode("")
            }
          }}
          placeholder="your.email@example.com"
          placeholderTextColor="#999"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading && !isVerified}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Verification Code</Text>
        <View style={styles.verificationRow}>
          <TextInput
            style={[styles.verificationInput, isVerified && styles.verificationInputVerified]}
            value={verificationCode}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, "")
              if (cleaned.length <= VERIFICATION_CODE_LENGTH) {
                setVerificationCode(cleaned)
                if (isVerified) {
                  setIsVerified(false)
                }
              }
            }}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            editable={!loading && !isVerified && !verifying && codeSent}
            maxLength={VERIFICATION_CODE_LENGTH}
          />
          <TouchableOpacity
            style={[styles.verifyButton, (sendingCode || countdown > 0 || isVerified) && styles.verifyButtonDisabled]}
            onPress={handleSendCode}
            disabled={sendingCode || loading || countdown > 0 || isVerified}
            activeOpacity={0.8}
          >
            {sendingCode ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.verifyButtonText}>
                {countdown > 0 ? `${countdown}s` : codeSent ? "Resend" : "Send Code"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {!codeSent && !isVerified && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Click "Send Code" to receive verification code via email</Text>
          </View>
        )}

        {verifying && (
          <View style={styles.verifiedContainer}>
            <ActivityIndicator color="#4caf50" size="small" />
            <Text style={[styles.verifiedText, { marginLeft: 8, color: "#666" }]}>Verifying...</Text>
          </View>
        )}

        {isVerified && (
          <View style={styles.verifiedContainer}>
            <Text style={styles.verifiedText}>✓ Email verified successfully</Text>
          </View>
        )}

        {codeSent && !isVerified && !verifying && verificationCode.length === VERIFICATION_CODE_LENGTH && (
          <TouchableOpacity 
            style={styles.manualVerifyButton} 
            onPress={handleManualVerify}
            activeOpacity={0.8}
          >
            <Text style={styles.manualVerifyButtonText}>Verify Code</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={loading} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#e91e63" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, (loading || !isVerified) && styles.nextButtonDisabled]}
          onPress={onNext}
          disabled={loading || !isVerified}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </>
  )
}