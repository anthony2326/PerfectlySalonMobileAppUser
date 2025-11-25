import { StyleSheet } from "react-native"
import { COLORS } from "../utils/constants"

export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.OVERLAY,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    maxWidth: 400,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 0.3,
    fontFamily: "Poppins-SemiBold",
  },
  message: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: "Inter-Variable",
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    gap: 12,
  },
  button: {
    padding: 12,
    borderRadius: 9,
    minWidth: 90,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  secondaryButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: COLORS.BORDER,
  },
  singleButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.4,
    fontFamily: "Inter-Variable",
  },
  primaryButtonText: {
    color: COLORS.BACKGROUND,
  },
  secondaryButtonText: {
    color: "#333333",
  },
})
