import { useState, useEffect } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
} from "react-native"
import { Ionicons } from '@expo/vector-icons'
import supabase from "../utils/supabase"
import { useUser } from "../screens/user context/UserContext"

export default function BookingStatusScreen({ navigation }) {
  const { userData } = useUser()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!userData || !userData.id) {
      console.error('[BOOKING_STATUS] No user logged in')
      setLoading(false)
      return
    }

    loadAppointments()

    const subscription = supabase
      .channel(`appointments-changes-${userData.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `user_id=eq.${userData.id}`
        },
        (payload) => {
          console.log('[REALTIME] Database change detected:', payload)
          loadAppointments()
        }
      )
      .subscribe()

    return () => {
      console.log('[REALTIME] Unsubscribing from appointments changes')
      supabase.removeChannel(subscription)
    }
  }, [filter, userData])

  const loadAppointments = async () => {
    if (!userData || !userData.id) {
      console.error('[BOOKING_STATUS] Cannot load appointments - no user ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('[BOOKING_STATUS] Loading appointments for user:', userData.id)
      
      let query = supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userData.id)
        .order('appointment_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('[BOOKING_STATUS] Error loading appointments:', error)
      } else {
        console.log('[BOOKING_STATUS] Loaded appointments:', data?.length || 0)
        setAppointments(data || [])
      }
    } catch (err) {
      console.error('[BOOKING_STATUS] Exception:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCancelBooking = async (appointmentId) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        {
          text: "No",
          style: "cancel"
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true)
              console.log('[CANCEL] Cancelling appointment:', appointmentId)

              const { error } = await supabase
                .from('appointments')
                .update({
                  status: 'cancelled',
                  updated_at: new Date().toISOString(),
                })
                .eq('id', appointmentId)

              if (error) {
                console.error('[CANCEL] Error cancelling appointment:', error)
                Alert.alert('Error', 'Failed to cancel booking. Please try again.')
              } else {
                console.log('[CANCEL] Appointment cancelled successfully')
                Alert.alert('Success', 'Your booking has been cancelled.')
                loadAppointments()
              }
            } catch (err) {
              console.error('[CANCEL] Exception:', err)
              Alert.alert('Error', 'An unexpected error occurred.')
            } finally {
              setCancelling(false)
            }
          }
        }
      ]
    )
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadAppointments()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'
      case 'confirmed':
        return '#10b981'
      case 'completed':
        return '#6b7280'
      case 'cancelled':
        return '#ef4444'
      default:
        return '#9ca3af'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return 'time-outline'
      case 'confirmed':
        return 'checkmark-circle-outline'
      case 'completed':
        return 'checkmark-done-circle-outline'
      case 'cancelled':
        return 'close-circle-outline'
      default:
        return 'help-circle-outline'
    }
  }

  const canCancelAppointment = (appointment) => {
    // Always allow cancellation for pending appointments
    if (appointment.status === 'pending') {
      return true
    }

    // For confirmed appointments, check if it's more than 24 hours away
    if (appointment.status === 'confirmed') {
      try {
        // Parse the appointment date
        const appointmentDate = new Date(appointment.appointment_date)
        
        // Parse the time (format: "09:00 AM" or "02:30 PM")
        const timeMatch = appointment.appointment_time.match(/(\d+):(\d+)\s*(AM|PM)/i)
        
        if (!timeMatch) {
          console.error('[CANCEL_CHECK] Invalid time format:', appointment.appointment_time)
          return true // Allow cancellation if time format is invalid
        }
        
        let hours = parseInt(timeMatch[1])
        const minutes = parseInt(timeMatch[2])
        const period = timeMatch[3].toUpperCase()
        
        // Convert to 24-hour format
        if (period === 'PM' && hours !== 12) {
          hours += 12
        } else if (period === 'AM' && hours === 12) {
          hours = 0
        }
        
        // Set the time on the appointment date
        appointmentDate.setHours(hours, minutes, 0, 0)
        
        const now = new Date()
        
        // Calculate hours until appointment
        const hoursUntilAppointment = (appointmentDate - now) / (1000 * 60 * 60)
        
        console.log('[CANCEL_CHECK] Appointment:', appointment.order_number)
        console.log('[CANCEL_CHECK] Date:', appointment.appointment_date)
        console.log('[CANCEL_CHECK] Time:', appointment.appointment_time)
        console.log('[CANCEL_CHECK] Parsed DateTime:', appointmentDate)
        console.log('[CANCEL_CHECK] Current DateTime:', now)
        console.log('[CANCEL_CHECK] Hours until appointment:', hoursUntilAppointment)
        console.log('[CANCEL_CHECK] Can cancel?:', hoursUntilAppointment > 24)
        
        // Return true if more than 24 hours away
        return hoursUntilAppointment > 24
      } catch (error) {
        console.error('[CANCEL_CHECK] Error parsing date:', error)
        return true // Allow cancellation if there's an error parsing the date
      }
    }

    return false
  }

  const goBack = () => {
    navigation.goBack()
  }

  const navigateToNotifications = () => {
    navigation.navigate("Notifications")
  }

  if (!userData || !userData.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Status</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="person-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>Not Logged In</Text>
          <Text style={styles.emptyText}>
            Please log in to view your bookings.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={navigateToNotifications}>
          <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>1</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'pending' && styles.filterTabActive]}
            onPress={() => setFilter('pending')}
          >
            <Text style={[styles.filterTabText, filter === 'pending' && styles.filterTabTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'confirmed' && styles.filterTabActive]}
            onPress={() => setFilter('confirmed')}
          >
            <Text style={[styles.filterTabText, filter === 'confirmed' && styles.filterTabTextActive]}>
              Confirmed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'completed' && styles.filterTabActive]}
            onPress={() => setFilter('completed')}
          >
            <Text style={[styles.filterTabText, filter === 'completed' && styles.filterTabTextActive]}>
              Completed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filter === 'cancelled' && styles.filterTabActive]}
            onPress={() => setFilter('cancelled')}
          >
            <Text style={[styles.filterTabText, filter === 'cancelled' && styles.filterTabTextActive]}>
              Cancelled
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#db2777" />
          <Text style={styles.loadingText}>Loading your appointments...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={80} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Appointments Found</Text>
          <Text style={styles.emptyText}>
            {filter === 'all' 
              ? "You don't have any bookings yet."
              : `You don't have any ${filter} appointments.`}
          </Text>
          <TouchableOpacity 
            style={styles.bookNowButton}
            onPress={() => navigation.navigate('Services')}
          >
            <Text style={styles.bookNowButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#db2777']} />
          }
        >
          <View style={styles.content}>
            {appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>{appointment.order_number}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(appointment.status) }
                    ]}>
                      <Ionicons 
                        name={getStatusIcon(appointment.status)} 
                        size={14} 
                        color="#ffffff" 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.statusText}>
                        {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={20} color="#db2777" />
                    <Text style={styles.infoText}>
                      {formatDate(appointment.appointment_date)}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="time-outline" size={20} color="#db2777" />
                    <Text style={styles.infoText}>{appointment.appointment_time}</Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Ionicons name="card-outline" size={20} color="#db2777" />
                    <Text style={styles.infoText}>{appointment.payment_method}</Text>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.servicesTitle}>Services:</Text>
                  {appointment.services && appointment.services.map((service, index) => (
                    <View key={index} style={styles.serviceRow}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.servicePrice}>₱{service.price}</Text>
                    </View>
                  ))}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Amount:</Text>
                    <Text style={styles.totalAmount}>₱{appointment.total_amount}</Text>
                  </View>

                  {/* Cancel Button for Pending and Confirmed Appointments */}
                  {canCancelAppointment(appointment) && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelBooking(appointment.id)}
                      disabled={cancelling}
                    >
                      <Ionicons name="close-circle-outline" size={18} color="#ffffff" />
                      <Text style={styles.cancelButtonText}>
                        {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.bookedDate}>
                    Booked on: {formatDate(appointment.created_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fdf2f8",
    borderBottomWidth: 1,
    borderBottomColor: "#f9a8d4",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f9a8d4",
  },
  filterTabActive: {
    backgroundColor: "#db2777",
    borderColor: "#db2777",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#db2777",
  },
  filterTabTextActive: {
    color: "#ffffff",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  bookNowButton: {
    backgroundColor: '#db2777',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  bookNowButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  appointmentCard: {
    backgroundColor: "#fdf2f8",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f9a8d4",
    overflow: "hidden",
  },
  cardHeader: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f9a8d4",
  },
  orderInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 12,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#f9a8d4",
    marginVertical: 16,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 14,
    color: "#4b5563",
    flex: 1,
  },
  servicePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f9a8d4",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#db2777",
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardFooter: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#f9a8d4",
  },
  bookedDate: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
  },
})