import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { Ionicons } from '@expo/vector-icons'
import supabase from "../../utils/supabase"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdf2f8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 2,
    borderBottomColor: "#db2777",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    fontFamily: "serif",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#db2777",
    marginBottom: 12,
    marginTop: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  announcementCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 6,
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  promotionCard: {
    borderLeftColor: "#db2777",
  },
  eventCard: {
    borderLeftColor: "#059669",
  },
  noticeCard: {
    borderLeftColor: "#dc2626",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  leftHeader: {
    flex: 1,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  dateContainer: {
    alignItems: "flex-end",
  },
  dateLabel: {
    fontSize: 10,
    color: "#9ca3af",
    fontWeight: "600",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: "600",
  },
  announcementTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 12,
    lineHeight: 26,
  },
  announcementDescription: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsContainer: {
    backgroundColor: "#fdf2f8",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  expiryIcon: {
    marginRight: 8,
  },
  expiryText: {
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "600",
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  discountIcon: {
    marginRight: 10,
  },
  discountText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#dc2626",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fbcfe8",
    backgroundColor: "#ffffff",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: "#db2777",
    borderColor: "#db2777",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#db2777",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
})

export default function AnnouncementsScreen({ navigation }) {
  const [activeFilter, setActiveFilter] = useState("all")
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('=== STARTING FETCH ===')
      console.log('Supabase client exists:', !!supabase)
      
      const { data, error, status, statusText } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })

      console.log('=== SUPABASE RESPONSE ===')
      console.log('Status:', status)
      console.log('Status Text:', statusText)
      console.log('Data:', data)
      console.log('Error:', error)
      console.log('Data length:', data?.length)

      if (error) {
        console.error('=== ERROR DETAILS ===')
        console.error('Error message:', error.message)
        console.error('Error details:', error.details)
        console.error('Error hint:', error.hint)
        throw error
      }

      if (data) {
        console.log('=== SUCCESS ===')
        console.log('Number of announcements:', data.length)
        setAnnouncements(data)
      }
    } catch (err) {
      console.error('=== CATCH ERROR ===')
      console.error('Error type:', err.name)
      console.error('Error message:', err.message)
      console.error('Full error:', err)
      setError('Failed to load announcements: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAnnouncements()
    setRefreshing(false)
  }

  const getBadgeColor = (priority) => {
    switch (priority) {
      case 'promotions':
        return '#db2777'
      case 'events':
        return '#059669'
      case 'notices':
        return '#dc2626'
      default:
        return '#6b7280'
    }
  }

  const getBadgeLabel = (priority) => {
    switch (priority) {
      case 'promotions':
        return 'PROMOTION'
      case 'events':
        return 'EVENT'
      case 'notices':
        return 'NOTICE'
      default:
        return 'ANNOUNCEMENT'
    }
  }

  const getCardStyle = (priority) => {
    switch (priority) {
      case 'promotions':
        return styles.promotionCard
      case 'events':
        return styles.eventCard
      case 'notices':
        return styles.noticeCard
      default:
        return styles.promotionCard
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const filteredAnnouncements = activeFilter === "all" 
    ? announcements 
    : announcements.filter(a => a.priority === activeFilter)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Announcements</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#db2777"]}
            tintColor="#db2777"
          />
        }
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === "all" && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter("all")}
          >
            <Text style={[
              styles.filterButtonText,
              activeFilter === "all" && styles.filterButtonTextActive
            ]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === "promotions" && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter("promotions")}
          >
            <Text style={[
              styles.filterButtonText,
              activeFilter === "promotions" && styles.filterButtonTextActive
            ]}>
              Promotions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === "events" && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter("events")}
          >
            <Text style={[
              styles.filterButtonText,
              activeFilter === "events" && styles.filterButtonTextActive
            ]}>
              Events
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              activeFilter === "notices" && styles.filterButtonActive
            ]}
            onPress={() => setActiveFilter("notices")}
          >
            <Text style={[
              styles.filterButtonText,
              activeFilter === "notices" && styles.filterButtonTextActive
            ]}>
              Notices
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#db2777" />
            <Text style={[styles.emptyText, { marginTop: 16 }]}>
              Loading announcements...
            </Text>
          </View>
        ) : filteredAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="megaphone-outline" 
              size={70} 
              color="#d1d5db" 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>
              {activeFilter === "all" ? "No announcements yet" : `No ${activeFilter} found`}
            </Text>
            <Text style={styles.emptyText}>
              {activeFilter === "all" 
                ? "Check back later for updates and special offers"
                : "Try selecting a different category"}
            </Text>
          </View>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <View 
              key={announcement.id} 
              style={[styles.announcementCard, getCardStyle(announcement.priority)]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.leftHeader}>
                  <View 
                    style={[
                      styles.badge, 
                      { backgroundColor: getBadgeColor(announcement.priority) }
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {getBadgeLabel(announcement.priority)}
                    </Text>
                  </View>
                </View>
                <View style={styles.dateContainer}>
                  <Text style={styles.dateLabel}>POSTED</Text>
                  <Text style={styles.dateText}>
                    {formatDate(announcement.created_at)}
                  </Text>
                </View>
              </View>

              <Text style={styles.announcementTitle}>
                {announcement.title}
              </Text>
              
              <Text style={styles.announcementDescription}>
                {announcement.message}
              </Text>

              {(announcement.valid_until || announcement.highlight) && (
                <View style={styles.detailsContainer}>
                  {announcement.valid_until && (
                    <View style={styles.expiryRow}>
                      <Ionicons 
                        name="time-outline" 
                        size={16} 
                        color="#dc2626"
                        style={styles.expiryIcon}
                      />
                      <Text style={styles.expiryText}>
                        Valid until {formatDate(announcement.valid_until)}
                      </Text>
                    </View>
                  )}
                  
                  {announcement.highlight && (
                    <View style={styles.discountContainer}>
                      <Ionicons 
                        name="pricetag" 
                        size={20} 
                        color="#dc2626"
                        style={styles.discountIcon}
                      />
                      <Text style={styles.discountText}>
                        {announcement.highlight}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}