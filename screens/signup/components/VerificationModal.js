import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react-native"
import { COLORS } from "../utils/constants"

export const VerificationModal = ({ visible, onClose, title, message, type = "info" }) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={56} color={COLORS.SUCCESS} strokeWidth={2} />
      case "error":
        return <XCircle size={56} color={COLORS.ERROR} strokeWidth={2} />
      case "warning":
        return <AlertCircle size={56} color={COLORS.WARNING} strokeWidth={2} />
      default:
        return <AlertCircle size={56} color={COLORS.PRIMARY} strokeWidth={2} />
    }
  }

  const getIconBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#e8f5e9"
      case "error":
        return "#ffebee"
      case "warning":
        return "#fff3e0"
      default:
        return "#f5e6ed"
    }
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor() }]}>
            {getIcon()}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 16,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "Poppins-SemiBold",
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: "Inter-Variable",
    fontWeight: "500",
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 40,
    minWidth: 120,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  buttonText: {
    color: COLORS.BACKGROUND,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "Inter-Variable",
    letterSpacing: 0.5,
  },
})