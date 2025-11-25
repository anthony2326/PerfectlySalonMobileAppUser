import { View, Image, TouchableOpacity, Text } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { styles } from "./PopularServicesStyle"

export default function PopularServices({ navigateToServices }) {
  const popularServices = [
    {
      icon: require("../../../../assets/hair.jpg"),
      title: "Hair Styling",
      description: "Expert cuts & colors",
      gradient: "#db2777",
    },
    {
      icon: require("../../../../assets/nails.jpg"),
      title: "Nail Care",
      description: "Mani & Pedi services",
      gradient: "#059669",
    },
    {
      icon: require("../../../../assets/waxing.jpg"),
      title: "Waxing",
      description: "Smooth & gentle care",
      gradient: "#f59e0b",
    },
    {
      icon: require("../../../../assets/facial.jpg"),
      title: "Facial",
      description: "Rejuvenating treatments",
      gradient: "#7c3aed",
    },
  ]

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Popular Services</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={navigateToServices}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={18} color="#db2777" />
        </TouchableOpacity>
      </View>
      <View style={styles.grid}>
        {popularServices.map((service, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={navigateToServices}
            activeOpacity={0.75}
          >
            <View style={[styles.iconWrapper, { backgroundColor: service.gradient + "20" }]}>
              <Image source={service.icon} style={styles.icon} resizeMode="cover" />
            </View>
            <Text style={styles.title}>{service.title}</Text>
            <Text style={styles.description}>{service.description}</Text>
            <View style={styles.actionArrow}>
              <Ionicons name="arrow-forward" size={16} color={service.gradient} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}