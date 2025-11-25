import { useState, useEffect, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Image,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import supabase from "../../utils/supabase"
import { styles, width } from "../dashboard/DashboardStyle"
import QuickActions from "./sections/QuickActions/QuickActions"
import LatestNews from "./sections/LatestNews/LatestNews"
import PopularServices from "./sections/PopularServices/PopularServices"
import BookNowCard from "./sections/BookNowCard/BookNowCard"

export default function DashboardScreen({ onLogout, navigation, userData }) {
  const [fadeAnim] = useState(new Animated.Value(0))
  const scrollY = useRef(new Animated.Value(0)).current
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuAnim] = useState(new Animated.Value(-width * 0.8))
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [currentUserData, setCurrentUserData] = useState(userData)
  const [loadingUserData, setLoadingUserData] = useState(true)

  useEffect(() => {
    console.log("[DASHBOARD] Initial userData:", userData)
    loadFreshUserData()

    console.log("[DASHBOARD] Setting up real-time subscription for user:", userData.id)
    
    const userChannel = supabase
      .channel(`dashboard-user-${userData.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `id=eq.${userData.id}`,
        },
        (payload) => {
          console.log("[DASHBOARD] Real-time user update received:", payload)
          setCurrentUserData(payload.new)
        }
      )
      .subscribe((status) => {
        console.log("[DASHBOARD] User subscription status:", status)
      })

    return () => {
      console.log("[DASHBOARD] Cleaning up user subscription")
      supabase.removeChannel(userChannel)
    }
  }, [userData.id])

  const loadFreshUserData = async () => {
    try {
      console.log("[DASHBOARD] Loading fresh user data...")
      setLoadingUserData(true)
      
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userData.id)
        .single()

      if (error) {
        console.error("[DASHBOARD] Error loading user data:", error)
        setCurrentUserData(userData)
      } else {
        console.log("[DASHBOARD] Fresh user data loaded:", data)
        setCurrentUserData(data)
      }
    } catch (err) {
      console.error("[DASHBOARD] Exception:", err)
      setCurrentUserData(userData)
    } finally {
      setLoadingUserData(false)
    }
  }

  useEffect(() => {
    loadAnnouncements()

    console.log("[DASHBOARD] Setting up real-time subscription for announcements...")

    const channel = supabase
      .channel("announcements-realtime-channel", {
        config: {
          broadcast: { self: false },
          presence: { key: "" },
        },
      })
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        (payload) => {
          console.log("[DASHBOARD] Real-time event received:", payload.eventType)

          if (payload.eventType === "INSERT") {
            console.log("[DASHBOARD] Adding new announcement:", payload.new.title)
            setAnnouncements((current) => {
              const updated = [payload.new, ...current].slice(0, 5)
              console.log("[DASHBOARD] Updated announcements count:", updated.length)
              return updated
            })
          } else if (payload.eventType === "UPDATE") {
            console.log("[DASHBOARD] Updating announcement:", payload.new.title)
            setAnnouncements((current) =>
              current.map((announcement) => (announcement.id === payload.new.id ? payload.new : announcement)),
            )
          } else if (payload.eventType === "DELETE") {
            console.log("[DASHBOARD] Deleting announcement ID:", payload.old.id)
            setAnnouncements((current) => current.filter((announcement) => announcement.id !== payload.old.id))
          }
        },
      )
      .subscribe((status, err) => {
        console.log("[DASHBOARD] Subscription status:", status)
        if (err) {
          console.error("[DASHBOARD] Subscription error:", err)
        }
        if (status === "SUBSCRIBED") {
          console.log("[DASHBOARD] Successfully subscribed to announcements realtime updates!")
        }
      })

    return () => {
      console.log("[DASHBOARD] Cleaning up announcements real-time subscription")
      supabase.removeChannel(channel)
    }
  }, [])

  const loadAnnouncements = async () => {
    try {
      console.log("[DASHBOARD] Loading announcements from database...")
      setLoadingAnnouncements(true)

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        console.error("[DASHBOARD] Error loading announcements:", error)
      } else {
        console.log("[DASHBOARD] Loaded", data?.length || 0, "announcements")
        setAnnouncements(data || [])
      }
    } catch (err) {
      console.error("[DASHBOARD] Exception loading announcements:", err)
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }, [])

  const handleScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
    useNativeDriver: false,
  })

  const navigateToServices = () => {
    navigation.navigate("Services")
  }

  const navigateToAnnouncements = () => {
    navigation.navigate("Announcements")
  }

  const navigateToNotifications = () => {
    navigation.navigate("Notifications")
  }

  const navigateToBookingStatus = () => {
    navigation.navigate("BookingStatus")
    closeMenu()
  }

  const navigateToAccount = () => {
    navigation.navigate("Account")
    closeMenu()
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 18) return "Good Afternoon"
    return "Good Evening"
  }

  const toggleMenu = () => {
    const toValue = menuVisible ? -width * 0.8 : 0
    Animated.timing(menuAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start()
    setMenuVisible(!menuVisible)
  }

  const closeMenu = () => {
    if (menuVisible) {
      Animated.timing(menuAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }).start()
      setMenuVisible(false)
    }
  }

  // Get user's name - handle both formats (full_name or name)
  const getUserName = () => {
    const name = currentUserData?.full_name || currentUserData?.name || userData?.full_name || userData?.name || "Guest"
    console.log("[DASHBOARD] Displaying name:", name)
    return name
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.logo}>
              <View style={styles.logoImageContainer}>
                <Image source={require("../../assets/logo-salon.jpg")} style={styles.logoImage} resizeMode="cover" />
              </View>
              <Text style={styles.logoTitle}>Perfectly Salon</Text>
            </View>

            <View style={styles.rightButtons}>
              <TouchableOpacity style={styles.notificationButton} onPress={navigateToNotifications}>
                <Ionicons name="notifications-outline" size={24} color="#1f2937" />
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>1</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.hamburgerButton} onPress={toggleMenu}>
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={closeMenu}
      >
        <View style={styles.contentContainer}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.greetingText}>{getGreeting()},</Text>
            <Text style={styles.userName}>{getUserName()}</Text>
          </View>

          {/* Quick Actions */}
          <QuickActions
            navigation={navigation}
          />

          {/* Latest News */}
          <LatestNews
            announcements={announcements}
            loadingAnnouncements={loadingAnnouncements}
            navigateToAnnouncements={navigateToAnnouncements}
          />

          {/* Popular Services */}
          <PopularServices
            navigateToServices={navigateToServices}
          />

          {/* Book Now Card */}
          <BookNowCard
            navigateToServices={navigateToServices}
          />
        </View>
      </ScrollView>

      {menuVisible && <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={closeMenu} />}

      <Animated.View style={[styles.sideMenu, { transform: [{ translateX: menuAnim }] }]}>
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle}>Menu</Text>
        </View>

        <View style={styles.menuItems}>
          <TouchableOpacity style={styles.menuItem} onPress={closeMenu}>
            <Ionicons name="home-outline" size={20} color="#1f2937" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemText}>HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToServices}>
            <Ionicons name="cut-outline" size={20} color="#1f2937" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemText}>SERVICES</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToBookingStatus}>
            <Ionicons name="calendar-outline" size={20} color="#1f2937" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemText}>MY BOOKINGS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={navigateToAccount}>
            <Ionicons name="person-outline" size={20} color="#1f2937" style={{ marginRight: 12 }} />
            <Text style={styles.menuItemText}>ACCOUNT</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" style={{ marginRight: 12 }} />
            <Text style={[styles.menuItemText, { color: "#dc2626" }]}>LOG OUT</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}