import { View, TouchableOpacity, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { styles } from "./BookNowCardStyle"

export default function BookNowCard({ navigateToServices }) {
  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={32} color="#ffffff" />
          </View>
          <Text style={styles.title}>Ready to Book?</Text>
          <Text style={styles.subtitle}>
            Schedule your appointment today and let us take care of you!
          </Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={navigateToServices}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Book Now</Text>
            <Ionicons name="arrow-forward" size={18} color="#db2777" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}