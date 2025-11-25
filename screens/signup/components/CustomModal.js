import { View, Text, Modal, TouchableOpacity } from "react-native"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react-native"
import { modalStyles } from "../styles/modal.styles"
import { COLORS } from "../utils/constants"

export const CustomModal = ({ visible, onClose, title, message, type = "info", buttons = [] }) => {
  const getIconForType = () => {
    const iconProps = { size: 32, color: COLORS.PRIMARY }
    switch (type) {
      case "success":
        return <CheckCircle {...iconProps} />
      case "error":
        return <XCircle {...iconProps} />
      case "warning":
        return <AlertCircle {...iconProps} />
      default:
        return <Info {...iconProps} />
    }
  }

  const modalButtons = buttons.length > 0 ? buttons : [{ text: "OK", onPress: onClose, style: "primary" }]

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modalContainer}>
          <View style={modalStyles.modalContent}>
            <View style={modalStyles.iconContainer}>{getIconForType()}</View>
            {title && <Text style={modalStyles.title}>{title}</Text>}
            {message && <Text style={modalStyles.message}>{message}</Text>}
            <View style={modalStyles.buttonContainer}>
              {modalButtons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    modalStyles.button,
                    button.style === "secondary" ? modalStyles.secondaryButton : modalStyles.primaryButton,
                    modalButtons.length === 1 && modalStyles.singleButton,
                  ]}
                  onPress={() => {
                    button.onPress?.()
                    onClose()
                  }}
                >
                  <Text
                    style={[
                      modalStyles.buttonText,
                      button.style === "secondary" ? modalStyles.secondaryButtonText : modalStyles.primaryButtonText,
                    ]}
                  >
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}
