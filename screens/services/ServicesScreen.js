import { useState, useEffect } from "react"
import { 
  View, 
  Text, 
  Dimensions, 
  Image, 
  Animated, 
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from "react-native"
import supabase from "../../utils/supabase"
import styles from './ServicesScreen.styles'

const { width } = Dimensions.get("window")

const iconMapping = {
  'hair': require("../../assets/hair.jpg"),
  'nails': require("../../assets/nails.jpg"),
  'waxing': require("../../assets/waxing.jpg"),
  'facial': require("../../assets/facial.jpg"),
  'footcare': require("../../assets/footspa.jpg"),
  'lashes': require("../../assets/lashes.jpg"),
}

export default function ServicesScreen({ navigation, userData }) {
  const [cardAnims] = useState([])
  const [fadeAnim] = useState(new Animated.Value(0))
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadServiceCategories()
  }, [])

  const loadServiceCategories = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (error) {
        console.error("[SERVICES] Error loading categories:", error)
        throw error
      }

      console.log("[SERVICES] Loaded categories:", data)
      setCategories(data || [])
      
      const anims = (data || []).map(() => new Animated.Value(0))
      cardAnims.push(...anims)

    } catch (error) {
      console.error("[SERVICES] Exception loading categories:", error)
      Alert.alert("Error", "Failed to load services. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (categories.length > 0 && cardAnims.length > 0) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.stagger(150, 
          cardAnims.map(anim => Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }))
        )
      ]).start()
    }
  }, [categories])

  const goBack = () => {
    navigation.navigate("Dashboard")
  }

  const handleServicePress = (category) => {
    if (!userData) {
      Alert.alert(
        "Login Required",
        "Please login to book an appointment",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      )
      return
    }

    navigation.navigate("ServiceBooking", {
      categorySlug: category.slug,
      categoryName: category.name
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#db2777" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Our Services</Text>
        </View>
        <View style={styles.headerSpacer} />
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Our Services</Text>
            </View>
            <Text style={styles.sectionTitle}>Expert Beauty Services</Text>
            <Text style={styles.sectionSubtitle}>
              From hair styling to skincare treatments, our professional team delivers exceptional results.
            </Text>
          </View>

          {categories.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No services available at the moment</Text>
            </View>
          )}

          <View style={styles.servicesGrid}>
            {categories.map((category, index) => (
              <Animated.View 
                key={category.id} 
                style={[
                  styles.serviceCard, 
                  { 
                    opacity: cardAnims[index] || 1,
                    transform: [{
                      translateY: cardAnims[index]?.interpolate({
                        inputRange: [0, 1],
                        outputRange: [50, 0]
                      }) || 0
                    }] 
                  }
                ]}
              >
                <Image 
                  source={iconMapping[category.slug] || iconMapping['hair']} 
                  style={styles.serviceIcon} 
                  resizeMode="contain" 
                />
                <Text style={styles.serviceTitle}>{category.name}</Text>
                <Text style={styles.serviceDescription}>
                  {category.description || 'Professional service by expert technicians'}
                </Text>
                <TouchableOpacity 
                  style={styles.serviceButton}
                  onPress={() => handleServicePress(category)}
                >
                  <Text style={styles.serviceButtonText}>Book Now</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}