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
  Alert,
} from "react-native"
import { Ionicons } from '@expo/vector-icons'
import { useUser } from '../user context/UserContext'
import supabase from "../../utils/supabase"

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fdf2f8",
    borderBottomWidth: 1,
    borderBottomColor: "#f9a8d4",
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
    paddingTop: 20,
  },
  notificationCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fbcfe8",
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: "#fef3f9",
    borderColor: "#f9a8d4",
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff4444",
  },
  dateText: {
    fontSize: 12,
    color: "#9ca3af",
    fontWeight: "500",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    lineHeight: 22,
  },
  notificationDescription: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  markReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#db2777",
  },
  markReadButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
  },
  clearAllButton: {
    backgroundColor: "#fdf2f8",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f9a8d4",
  },
  clearAllButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#db2777",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    textAlign: "center",
    marginTop: 16,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: "#db2777",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  debugContainer: {
    backgroundColor: "#fef3c7",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  debugText: {
    fontSize: 12,
    color: "#92400e",
    marginBottom: 4,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#db2777",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
})

export default function NotificationScreen({ navigation }) {
  const { userData } = useUser()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('checking')

  // Get email from userData
  const userEmail = userData?.email || userData?.client_email || userData?.user_email

  useEffect(() => {
    console.log('='.repeat(60))
    console.log('[NOTIFICATION] Component Mounted')
    console.log('[NOTIFICATION] User Data:', JSON.stringify(userData, null, 2))
    console.log('[NOTIFICATION] Email:', userEmail)
    console.log('='.repeat(60))
  }, [])

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (userEmail && connectionStatus === 'connected') {
      console.log('[NOTIFICATION] User email found:', userEmail)
      fetchNotifications()
      const cleanup = setupRealtimeSubscription()
      return cleanup
    } else if (!userEmail) {
      console.error('[NOTIFICATION] No user email found!')
      setLoading(false)
      setError('No user email found')
    }
  }, [userEmail, connectionStatus])

  const checkConnection = async () => {
    try {
      console.log('[NOTIFICATION] Testing Supabase connection...')
      
      // Test basic connection
      const { data, error } = await supabase
        .from('notifications')
        .select('count', { count: 'exact', head: true })

      if (error) {
        console.error('[NOTIFICATION] Connection test failed:', error)
        setConnectionStatus('error')
        setError(`Connection failed: ${error.message}`)
      } else {
        console.log('[NOTIFICATION] Connection successful!')
        setConnectionStatus('connected')
      }
    } catch (err) {
      console.error('[NOTIFICATION] Connection exception:', err)
      setConnectionStatus('error')
      setError(`Connection error: ${err.message}`)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!userEmail) return () => {}

    const channelName = `notifications-${userEmail.replace(/[@.]/g, '_')}-${Date.now()}`
    console.log('[NOTIFICATION] Setting up realtime:', channelName)
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_email=eq.${userEmail}`,
        },
        (payload) => {
          console.log('[NOTIFICATION] Realtime event:', payload.eventType)
          console.log('[NOTIFICATION] Data:', payload.new)
          fetchNotifications()
        }
      )
      .subscribe((status) => {
        console.log('[NOTIFICATION] Subscription status:', status)
      })

    return () => {
      console.log('[NOTIFICATION] Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }

  const fetchNotifications = async () => {
    if (!userEmail) {
      console.error('[NOTIFICATION] Cannot fetch - no email')
      return
    }

    try {
      console.log('[NOTIFICATION] Fetching notifications for:', userEmail)
      setError(null)
      
      // Test total count first
      const { count: totalCount, error: countError } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })

      console.log('[NOTIFICATION] Total notifications in DB:', totalCount)
      if (countError) {
        console.error('[NOTIFICATION] Count error:', countError)
        throw countError
      }

      // Fetch user's notifications with explicit column selection
      const { data, error, count } = await supabase
        .from('notifications')
        .select(`
          id,
          user_email,
          appointment_id,
          title,
          description,
          type,
          is_read,
          created_at
        `, { count: 'exact' })
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })

      console.log('[NOTIFICATION] Query result:')
      console.log('  - Count:', count)
      console.log('  - Data length:', data?.length)
      console.log('  - Error:', error)
      
      if (error) {
        console.error('[NOTIFICATION] Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Show user-friendly error
        let errorMessage = 'Failed to load notifications'
        if (error.code === 'PGRST116') {
          errorMessage = 'Permission denied. Please check your database policies.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        throw new Error(errorMessage)
      }

      console.log('[NOTIFICATION] Success! Found', data?.length || 0, 'notifications')
      if (data && data.length > 0) {
        console.log('[NOTIFICATION] First notification:', data[0])
      }
      
      setNotifications(data || [])
      setError(null)
      
    } catch (err) {
      console.error('[NOTIFICATION] Exception:', err)
      setError(err.message || 'An error occurred while loading notifications')
      setNotifications([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchNotifications()
  }

  const getBadgeColor = (type) => {
    switch (type) {
      case 'reminder':
        return '#059669'
      case 'cancelled':
        return '#dc2626'
      case 'confirmed':
        return '#2563eb'
      case 'rescheduled':
        return '#d97706'
      case 'completed':
        return '#059669'
      default:
        return '#6b7280'
    }
  }

  const getBadgeLabel = (type) => {
    switch (type) {
      case 'reminder':
        return 'REMINDER'
      case 'cancelled':
        return 'CANCELLED'
      case 'confirmed':
        return 'CONFIRMED'
      case 'rescheduled':
        return 'RESCHEDULED'
      case 'completed':
        return 'COMPLETED'
      default:
        return 'NOTIFICATION'
    }
  }

  const markAsRead = async (id) => {
    try {
      console.log('[NOTIFICATION] Marking as read:', id)
      
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) {
        console.error('[NOTIFICATION] Mark as read error:', error)
        Alert.alert('Error', 'Failed to mark notification as read')
        return
      }

      console.log('[NOTIFICATION] Marked as read successfully')
      
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      )
    } catch (err) {
      console.error('[NOTIFICATION] Exception marking as read:', err)
      Alert.alert('Error', 'An error occurred')
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id)

      if (unreadIds.length === 0) return

      console.log('[NOTIFICATION] Marking all as read:', unreadIds.length)

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (error) {
        console.error('[NOTIFICATION] Mark all error:', error)
        Alert.alert('Error', 'Failed to mark all as read')
        return
      }

      console.log('[NOTIFICATION] All marked as read')

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      )
    } catch (err) {
      console.error('[NOTIFICATION] Exception marking all:', err)
      Alert.alert('Error', 'An error occurred')
    }
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const isToday = date.toDateString() === today.toDateString()
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
    }
    
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  // No user logged in
  if (!userEmail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#dc2626" />
          <Text style={styles.errorText}>
            Please log in to view your notifications
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Connection error
  if (connectionStatus === 'error' && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={64} color="#dc2626" />
          <Text style={styles.errorText}>
            {error || 'Failed to connect to server'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={checkConnection}
          >
            <Text style={styles.retryButtonText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#db2777" />
          <Text style={{ marginTop: 16, color: '#6b7280' }}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Text>
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
        {/* Debug Info */}
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>🔍 Debug Info:</Text>
          <Text style={styles.debugText}>Email: {userEmail}</Text>
          <Text style={styles.debugText}>Notifications: {notifications.length}</Text>
          <Text style={styles.debugText}>Unread: {unreadCount}</Text>
          <Text style={styles.debugText}>Status: {connectionStatus}</Text>
          {error && <Text style={styles.debugText}>Error: {error}</Text>}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.clearAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.clearAllButtonText}>Mark All as Read</Text>
          </TouchableOpacity>
        )}

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="notifications-off-outline" 
              size={64} 
              color="#d1d5db" 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
              Pull down to refresh
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <View 
              key={notification.id} 
              style={[
                styles.notificationCard,
                !notification.is_read && styles.unreadCard
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.badgeContainer}>
                  <View 
                    style={[
                      styles.badge, 
                      { backgroundColor: getBadgeColor(notification.type) }
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {getBadgeLabel(notification.type)}
                    </Text>
                  </View>
                  {!notification.is_read && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
                <Text style={styles.dateText}>
                  {formatDateTime(notification.created_at)}
                </Text>
              </View>

              <Text style={styles.notificationTitle}>
                {notification.title}
              </Text>
              
              <Text style={styles.notificationDescription}>
                {notification.description}
              </Text>

              {!notification.is_read && (
                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={styles.markReadButton}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <Text style={styles.markReadButtonText}>Mark as Read</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  )
}