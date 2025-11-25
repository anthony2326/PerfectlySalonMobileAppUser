import { useState } from "react"
import { View, TouchableOpacity, Text, Modal, Linking } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { styles } from "./QuickActionsStyle"

export default function QuickActions({ navigation }) {
  const [showContactModal, setShowContactModal] = useState(false)

  const handleContactPress = () => {
    setShowContactModal(true)
  }

  const handleCallPress = (number) => {
    Linking.openURL(`tel:${number}`)
  }

  const handleFacebookPress = () => {
    Linking.openURL('https://www.facebook.com/PerfectlySalon')
  }

  const quickActions = [
    {
      icon: "calendar",
      title: "Book\nAppointment",
      color: "#db2777",
      action: () => navigation.navigate("Services"),
    },
    {
      icon: "time",
      title: "My\nBookings",
      color: "#059669",
      action: () => navigation.navigate("BookingStatus"),
    },
    {
      icon: "person",
      title: "My\nAccount",
      color: "#7c3aed",
      action: () => navigation.navigate("Account"),
    },
    {
      icon: "call",
      title: "Contact\nUs",
      color: "#2563eb",
      action: handleContactPress,
    },
  ]

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {quickActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { backgroundColor: action.color }]}
              onPress={action.action}
              activeOpacity={0.75}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={action.icon} size={32} color="#ffffff" />
              </View>
              <Text style={styles.cardText}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contact Us Modal */}
      <Modal
        visible={showContactModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContactModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowContactModal(false)}
            >
              <Ionicons name="close-circle" size={32} color="#db2777" />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Ionicons name="location" size={48} color="#db2777" />
              <Text style={styles.modalTitle}>Contact Us</Text>
            </View>

            <View style={styles.contactSection}>
              <View style={styles.contactItem}>
                <Ionicons name="business" size={24} color="#db2777" />
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactLabel}>Branch</Text>
                  <Text style={styles.contactValue}>
                    E Rodriguez Highway{'\n'}
                    Manggahan Rodriguez Rizal
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.contactItem}>
                <Ionicons name="call" size={24} color="#db2777" />
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactLabel}>Contact Number</Text>
                  <TouchableOpacity onPress={() => handleCallPress('09391084459')}>
                    <Text style={styles.contactValueLink}>09391084459</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleCallPress('09660096449')}>
                    <Text style={styles.contactValueLink}>09660096449</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.contactItem}>
                <Ionicons name="logo-facebook" size={24} color="#db2777" />
                <View style={styles.contactTextContainer}>
                  <Text style={styles.contactLabel}>Facebook Page</Text>
                  <TouchableOpacity onPress={handleFacebookPress}>
                    <Text style={styles.contactValueLink}>Perfectly Salon</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.okButton}
              onPress={() => setShowContactModal(false)}
            >
              <Text style={styles.okButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}