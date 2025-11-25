import { StyleSheet } from "react-native"
import { commonStyles } from "./common.styles"
import { COLORS } from "../utils/constants"

export const step3Styles = StyleSheet.create({
  ...commonStyles,
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.BORDER,
    borderRadius: 9,
    backgroundColor: COLORS.BACKGROUND,
  },
  passwordInput: {
    flex: 1,
    padding: 11,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "500",
    fontFamily: "Inter-Variable",
  },
  eyeIcon: {
    padding: 10,
  },
  signUpButton: {
    flex: 1,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 9,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  signUpButtonDisabled: {
    backgroundColor: COLORS.PRIMARY_LIGHT,
    shadowOpacity: 0.1,
  },
  signUpButtonText: {
    color: COLORS.BACKGROUND,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.6,
    fontFamily: "Inter-Variable",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: COLORS.BACKGROUND,
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
    fontFamily: "Inter-Variable",
  },
})
