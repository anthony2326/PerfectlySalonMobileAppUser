import { useEffect, useRef, useState } from "react"
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { styles } from "./LatestNewsStyle"

export default function LatestNews({
  announcements,
  loadingAnnouncements,
  navigateToAnnouncements,
}) {
  const scrollViewRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const autoScrollInterval = useRef(null)
  const manualScrollTimeout = useRef(null)
  const isAutoScrolling = useRef(false)

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const getBadgeColor = (priority) => {
    switch (priority) {
      case "promotions":
        return "#db2777"
      case "events":
        return "#059669"
      case "notices":
        return "#dc2626"
      default:
        return "#6b7280"
    }
  }

  const getBadgeIcon = (priority) => {
    switch (priority) {
      case "promotions":
        return "gift"
      case "events":
        return "calendar"
      case "notices":
        return "alert-circle"
      default:
        return "megaphone"
    }
  }

  const displayedAnnouncements = announcements.slice(0, 3)
  const cardWidth = styles.card.width + 16 // card width + margin

  // Start auto-scrolling
  const startAutoScroll = () => {
    if (displayedAnnouncements.length <= 1) return

    autoScrollInterval.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % displayedAnnouncements.length
        isAutoScrolling.current = true
        
        scrollViewRef.current?.scrollTo({
          x: nextIndex * cardWidth,
          animated: true,
        })
        
        // Reset auto-scrolling flag after animation
        setTimeout(() => {
          isAutoScrolling.current = false
        }, 300)
        
        return nextIndex
      })
    }, 3000) // Auto-scroll every 3 seconds
  }

  // Stop auto-scrolling
  const stopAutoScroll = () => {
    if (autoScrollInterval.current) {
      clearInterval(autoScrollInterval.current)
      autoScrollInterval.current = null
    }
  }

  // Handle scroll in real-time for dot animation
  const handleScroll = (event) => {
    // Don't interfere if this is an auto-scroll
    if (isAutoScrolling.current) return

    const offsetX = event.nativeEvent.contentOffset.x
    const index = Math.round(offsetX / cardWidth)
    
    if (index !== currentIndex && index >= 0 && index < displayedAnnouncements.length) {
      setCurrentIndex(index)
    }
  }

  // Handle manual scroll end to restart auto-scroll
  const handleScrollEnd = () => {
    // Stop auto-scroll when user manually scrolls
    stopAutoScroll()

    // Clear any existing timeout
    if (manualScrollTimeout.current) {
      clearTimeout(manualScrollTimeout.current)
    }

    // Resume auto-scroll after 3 seconds of inactivity
    manualScrollTimeout.current = setTimeout(() => {
      startAutoScroll()
    }, 3000)
  }

  // Initialize auto-scroll
  useEffect(() => {
    if (!loadingAnnouncements && displayedAnnouncements.length > 1) {
      startAutoScroll()
    }

    return () => {
      stopAutoScroll()
      if (manualScrollTimeout.current) {
        clearTimeout(manualScrollTimeout.current)
      }
    }
  }, [loadingAnnouncements, displayedAnnouncements.length])

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Latest News</Text>
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={navigateToAnnouncements}
          activeOpacity={0.7}
        >
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={18} color="#db2777" />
        </TouchableOpacity>
      </View>

      {loadingAnnouncements ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#db2777" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : announcements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={56} color="#d1d5db" />
          <Text style={styles.emptyText}>No announcements yet</Text>
          <Text style={styles.emptySubtext}>Check back soon for updates</Text>
        </View>
      ) : (
        <>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            snapToInterval={cardWidth}
            decelerationRate="fast"
            pagingEnabled={false}
            snapToAlignment="start"
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
          >
            {displayedAnnouncements.map((announcement) => (
              <View key={announcement.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View
                    style={[styles.badge, { backgroundColor: getBadgeColor(announcement.priority) }]}
                  >
                    <Ionicons name={getBadgeIcon(announcement.priority)} size={14} color="#ffffff" />
                    <Text style={styles.badgeText}>{announcement.priority.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(announcement.created_at)}</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {announcement.title}
                </Text>
                <Text style={styles.cardDescription} numberOfLines={3}>
                  {announcement.message}
                </Text>
                {announcement.highlight && (
                  <View style={styles.highlightBanner}>
                    <Ionicons name="flash" size={16} color="#dc2626" />
                    <Text style={styles.highlightText}>{announcement.highlight}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
          
          {/* Pagination Dots */}
          {displayedAnnouncements.length > 1 && (
            <View style={localStyles.paginationContainer}>
              {displayedAnnouncements.map((_, index) => (
                <View
                  key={index}
                  style={[
                    localStyles.paginationDot,
                    currentIndex === index && localStyles.paginationDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  )
}

const localStyles = StyleSheet.create({
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: "#db2777",
  },
})