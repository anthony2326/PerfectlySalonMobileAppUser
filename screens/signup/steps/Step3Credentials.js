import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native"
import { step3Styles as styles } from "../styles/step3.styles"
import { ArrowLeft, Eye, EyeOff } from "lucide-react-native"

export const Step3Credentials = ({
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  toggleShowPassword,
  showConfirmPassword,
  toggleShowConfirmPassword,
  onSubmit,
  onBack,
  loading,
}) => {
  return (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="Choose a username"
          placeholderTextColor="#999"
          autoCapitalize="none"
          editable={!loading}
          maxLength={20}
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor="#999"
            secureTextEntry={!showPassword}
            editable={!loading}
            maxLength={100}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={toggleShowPassword} disabled={loading} activeOpacity={0.6}>
            {showPassword ? <Eye size={18} color="#e91e63" /> : <EyeOff size={18} color="#999" />}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
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
            {showConfirmPassword ? <Eye size={18} color="#e91e63" /> : <EyeOff size={18} color="#999" />}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={loading} activeOpacity={0.8}>
          <ArrowLeft size={20} color="#e91e63" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
          onPress={onSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.loadingText}>Creating...</Text>
            </View>
          ) : (
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  )
}
