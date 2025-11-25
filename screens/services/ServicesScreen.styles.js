import { StyleSheet, Dimensions } from "react-native"

const { width } = Dimensions.get("window")

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f9a8d4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#db2777",
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    fontFamily: "serif",
  },
  headerSpacer: {
    width: 60,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 48,
    backgroundColor: "#ffffff",
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 48,
  },
  badge: {
    backgroundColor: "#db2777",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#ffffff",
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 34,
    fontFamily: "serif",
  },
  sectionSubtitle: {
    fontSize: 18,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 28,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9ca3af",
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceCard: {
    width: (width - 60) / 2,
    backgroundColor: "#fdf2f8",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fbcfe8",
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    alignItems: "center",
  },
  serviceIcon: {
    width: 50,
    height: 50,
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    lineHeight: 22,
    textAlign: "center",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 16,
  },
  serviceButton: {
    backgroundColor: "#db2777",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  serviceButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
})