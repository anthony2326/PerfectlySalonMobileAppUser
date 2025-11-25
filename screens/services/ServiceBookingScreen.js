import { useState, useEffect } from "react"
import { View, Text, Animated, SafeAreaView, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import styles from './ServiceBookingScreen.styles'
import supabase from '../../utils/supabase'
import { 
  calculateTotal, 
  getSelectedServicesList, 
  formatBookingData,
  getInitialBookingState 
} from './utils/serviceBooking'
import { 
  getDaysInMonth, 
  isDateDisabled, 
  changeMonth as changeMonthUtil,
  formatMonthYear 
} from './utils/calendar'
import { loadServicesData, createAppointment } from '../../services/serviceBooking'

export default function ServiceBookingScreen({ route, navigation, userData }) {
  const { categorySlug, categoryName } = route.params
  
  const [fadeAnim] = useState(new Animated.Value(0))
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState([])
  const [addons, setAddons] = useState([])
  const [categoryId, setCategoryId] = useState(null)
  const [selectedServices, setSelectedServices] = useState({})
  const [addonQuantities, setAddonQuantities] = useState({})
  const [bookingStep, setBookingStep] = useState("services")
  
  const [selectedDate, setSelectedDate] = useState(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedHour, setSelectedHour] = useState(10)
  const [selectedMinute, setSelectedMinute] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState("AM")
  const [paymentMethod, setPaymentMethod] = useState("Cash")

  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState(null)

  const [occupiedSlots, setOccupiedSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Available hours: 10 AM - 7 PM
  const availableHours = [
    { hour: 10, period: 'AM' },
    { hour: 11, period: 'AM' },
    { hour: 12, period: 'PM' },
    { hour: 1, period: 'PM' },
    { hour: 2, period: 'PM' },
    { hour: 3, period: 'PM' },
    { hour: 4, period: 'PM' },
    { hour: 5, period: 'PM' },
    { hour: 6, period: 'PM' },
    { hour: 7, period: 'PM' },
  ]

  useEffect(() => {
    loadData()
  }, [categorySlug])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  useEffect(() => {
    if (!userData) {
      Alert.alert(
        "Login Required",
        "Please login to book an appointment",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      )
    }
  }, [userData, navigation])

  useEffect(() => {
    if (selectedDate && categorySlug && services.length > 0) {
      console.log('[TIME_SLOTS] Triggering slot check - Date:', selectedDate, 'Category:', categorySlug, 'Services loaded:', services.length)
      loadOccupiedSlots(selectedDate)
    }
  }, [selectedDate, categorySlug])

  useEffect(() => {
    if (!selectedDate || !categorySlug) return

    console.log('[REALTIME] Setting up subscription for appointments')

    const channel = supabase
      .channel('appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('[REALTIME] Appointment change detected:', payload)
          
          if (selectedDate) {
            console.log('[REALTIME] Reloading occupied slots...')
            loadOccupiedSlots(selectedDate)
          }
        }
      )
      .subscribe()

    return () => {
      console.log('[REALTIME] Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  }, [selectedDate, categorySlug, services])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await loadServicesData(categorySlug)
      setCategoryId(data.categoryId)
      setServices(data.services)
      setAddons(data.addons)
    } catch (error) {
      Alert.alert('Error', 'Failed to load services. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadOccupiedSlots = async (date) => {
    try {
      setLoadingSlots(true)
      const formattedDate = formatDateForDatabase(date)
      
      console.log('[TIME_SLOTS] ========================================')
      console.log('[TIME_SLOTS] Checking occupied slots for DATE:', formattedDate)
      console.log('[TIME_SLOTS] Current CATEGORY SLUG:', categorySlug)
      
      const { data: allAppointments, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', formattedDate)
        .eq('status', 'confirmed')
      
      if (error) {
        console.error('[TIME_SLOTS] Error loading slots:', error)
        return
      }
      
      console.log('[TIME_SLOTS] Total CONFIRMED appointments found:', allAppointments?.length || 0)
      
      if (!allAppointments || allAppointments.length === 0) {
        console.log('[TIME_SLOTS] No confirmed appointments found for this date')
        setOccupiedSlots([])
        return
      }
      
      const currentCategoryServiceNames = [
        ...services.map(s => s.name.toLowerCase().trim()),
        ...addons.map(a => a.name.toLowerCase().trim())
      ]
      
      console.log('[TIME_SLOTS] Current category services:', currentCategoryServiceNames)
      
      const occupied = []
      
      allAppointments.forEach((apt, idx) => {
        console.log(`\n[TIME_SLOTS] --- Checking Appointment ${idx + 1} ---`)
        console.log('[TIME_SLOTS] Time:', apt.appointment_time)
        console.log('[TIME_SLOTS] Status:', apt.status)
        console.log('[TIME_SLOTS] Category Slug:', apt.category_slug)
        console.log('[TIME_SLOTS] Services:', apt.services)
        
        if (apt.category_slug === categorySlug) {
          console.log('[TIME_SLOTS] ✅ MATCH by category_slug:', apt.category_slug)
          occupied.push(apt.appointment_time)
          return
        }
        
        if (!apt.category_slug && apt.services) {
          const servicesArray = Array.isArray(apt.services) ? apt.services : []
          
          const hasMatchingService = servicesArray.some(service => {
            const serviceName = (service.name || '').toLowerCase().trim()
            const matches = currentCategoryServiceNames.includes(serviceName)
            
            if (matches) {
              console.log('[TIME_SLOTS] ✅ MATCH by service name:', service.name)
            }
            
            return matches
          })
          
          if (hasMatchingService) {
            occupied.push(apt.appointment_time)
          } else {
            console.log('[TIME_SLOTS] ❌ No match - different category')
          }
        } else {
          console.log('[TIME_SLOTS] ❌ No match - different category')
        }
      })
      
      console.log('\n[TIME_SLOTS] 🚫 FINAL BLOCKED TIMES:', occupied)
      console.log('[TIME_SLOTS] ========================================\n')
      setOccupiedSlots(occupied)
      
    } catch (err) {
      console.error('[TIME_SLOTS] Exception:', err)
    } finally {
      setLoadingSlots(false)
    }
  }

  const isTimeSlotOccupied = (hour, minute, period) => {
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`
    return occupiedSlots.includes(timeString)
  }

  const getCurrentTimeString = () => {
    return `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`
  }

  const navigateToNotifications = () => {
    navigation.navigate("Notifications")
  }

  const goBack = () => {
    if (bookingStep === "appointment") {
      setBookingStep("services")
    } else {
      navigation.navigate("Services")
    }
  }

  const toggleService = (serviceId) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: !prev[serviceId],
    }))
  }

  const updateAddonQuantity = (addonId, change) => {
    setAddonQuantities((prev) => {
      const currentQty = prev[addonId] || 0
      const newQty = Math.max(0, currentQty + change)
      return {
        ...prev,
        [addonId]: newQty,
      }
    })
  }

  const handleConfirmServices = () => {
    const total = calculateTotal(selectedServices, addonQuantities, services, addons)
    if (total > 0) {
      setBookingStep("appointment")
      const today = new Date()
      setSelectedDate(today)
      setTimeout(() => {
        loadOccupiedSlots(today)
      }, 100)
    } else {
      Alert.alert("No Services Selected", "Please select at least one service to continue.")
    }
  }

  const changeMonth = (direction) => {
    setCurrentMonth(changeMonthUtil(currentMonth, direction))
  }

  const formatDateForDatabase = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const handleBookAppointmentClick = () => {
    if (!userData) {
      Alert.alert(
        "Login Required",
        "Please login to book an appointment",
        [{ text: "OK", onPress: () => navigation.navigate("Login") }]
      )
      return
    }

    if (!selectedDate) {
      setBookingError("Please select an appointment date")
      return
    }

    if (isTimeSlotOccupied(selectedHour, selectedMinute, selectedPeriod)) {
      Alert.alert(
        "Time Slot Occupied",
        `The time slot ${getCurrentTimeString()} is already confirmed by another booking. Please select another time.`
      )
      setBookingError(`Time slot ${getCurrentTimeString()} is occupied`)
      return
    }

    if (paymentMethod !== "Cash") {
      setBookingError("Only Cash payment is currently available")
      return
    }

    // Show confirmation modal first
    setShowConfirmationModal(true)
  }

  const handleConfirmBooking = async () => {
    setShowConfirmationModal(false)
    setIsBooking(true)
    setBookingError(null)

    try {
      console.log('[BOOKING] Starting appointment booking...')
      console.log('[BOOKING] User data:', userData)
      console.log('[BOOKING] Selected date:', selectedDate)
      console.log('[BOOKING] Selected time:', getCurrentTimeString())
      
      const servicesList = getSelectedServicesList(selectedServices, addonQuantities, services, addons)
      const total = calculateTotal(selectedServices, addonQuantities, services, addons)
      const formattedDate = formatDateForDatabase(selectedDate)
      
      const bookingData = {
        user_id: userData.id,
        client_name: userData.name || userData.username,
        client_email: userData.email,
        client_phone: userData.contactNumber || 'N/A',
        services: servicesList,
        category_slug: categorySlug,
        category_name: categoryName,
        total_amount: total,
        appointment_date: formattedDate,
        appointment_time: getCurrentTimeString(),
        payment_method: paymentMethod,
        status: 'pending',
        order_number: `ORD-${Date.now().toString().slice(-8)}`,
        stylist: 'To be assigned',
        duration: '1 hour',
        notes: '',
        created_at: new Date().toISOString(),
      }

      console.log('[BOOKING] Booking data prepared:', bookingData)

      const appointment = await createAppointment(bookingData)
      
      console.log('[BOOKING] ✅ Appointment created successfully:', appointment)
      
      setShowSuccessModal(true)
      
    } catch (error) {
      console.error('[BOOKING] ❌ Error booking appointment:', error)
      setBookingError(error.message || 'Failed to book appointment. Please try again.')
      Alert.alert("Booking Failed", error.message || 'Failed to book appointment. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  const handleViewMyBooking = () => {
    setShowSuccessModal(false)
    const initialState = getInitialBookingState()
    setSelectedServices(initialState.selectedServices)
    setAddonQuantities(initialState.addonQuantities)
    setBookingStep(initialState.bookingStep)
    setSelectedDate(initialState.selectedDate)
    setSelectedHour(initialState.selectedHour)
    setSelectedMinute(initialState.selectedMinute)
    setSelectedPeriod(initialState.selectedPeriod)
    setPaymentMethod(initialState.paymentMethod)
    navigation.navigate("BookingStatus")
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#db2777" />
          <Text style={styles.loadingText}>Loading services...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="person-circle-outline" size={80} color="#db2777" style={{ marginBottom: 20 }} />
          <Text style={styles.loginPromptText}>Please login to book an appointment</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (bookingStep === "appointment") {
    const servicesList = getSelectedServicesList(selectedServices, addonQuantities, services, addons)
    const total = calculateTotal(selectedServices, addonQuantities, services, addons)
    const monthYear = formatMonthYear(currentMonth)
    const days = getDaysInMonth(currentMonth)

    return (
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.backButton} onPress={goBack}>
            <Text style={styles.backButtonText}>← Book Appointment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={navigateToNotifications}>
            <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          </TouchableOpacity>
        </Animated.View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            {/* User Info Section */}
            <View style={styles.userInfoSection}>
              <View style={styles.userInfoHeader}>
                <Ionicons name="person-circle" size={40} color="#db2777" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.userInfoTitle}>Booking for:</Text>
                  <Text style={styles.userInfoName}>{userData.name || userData.username}</Text>
                </View>
              </View>
              <View style={styles.userInfoDetails}>
                <View style={styles.userInfoRow}>
                  <Ionicons name="mail" size={16} color="#6b7280" />
                  <Text style={styles.userInfoDetail}>{userData.email}</Text>
                </View>
                {userData.contactNumber && (
                  <View style={styles.userInfoRow}>
                    <Ionicons name="call" size={16} color="#6b7280" />
                    <Text style={styles.userInfoDetail}>{userData.contactNumber}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Order Summary */}
            <View style={styles.orderSummary}>
              <Text style={styles.orderNumber}>Book Order No. {Date.now().toString().slice(-6)}</Text>
              {servicesList.map((service, index) => (
                <View key={index} style={styles.orderItem}>
                  <Text style={styles.orderItemName}>{service.name}</Text>
                  <Text style={styles.orderItemPrice}>₱{service.price}</Text>
                </View>
              ))}
              <View style={styles.orderTotal}>
                <Text style={styles.orderTotalLabel}>Total</Text>
                <Text style={styles.orderTotalAmount}>₱{total}</Text>
              </View>
            </View>

            {/* Date Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Date</Text>
              {selectedDate && (
                <Text style={styles.selectedDateText}>
                  Selected: {formatDateForDatabase(selectedDate)}
                </Text>
              )}
              <View style={styles.calendar}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => changeMonth(-1)}>
                    <Text style={styles.calendarArrow}>{"<"}</Text>
                  </TouchableOpacity>
                  <Text style={styles.calendarMonth}>{monthYear}</Text>
                  <TouchableOpacity onPress={() => changeMonth(1)}>
                    <Text style={styles.calendarArrow}>{">"}</Text>
                  </TouchableOpacity>
                </View>
                
                <View style={styles.calendarDaysHeader}>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <Text key={day} style={styles.calendarDayName}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {days.map((day, index) => {
                    const disabled = isDateDisabled(day.date)
                    const isSelected = selectedDate && 
                      day.date.toDateString() === selectedDate.toDateString()
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDay,
                          !day.isCurrentMonth && styles.calendarDayOtherMonth,
                          disabled && styles.calendarDayDisabled,
                          isSelected && styles.calendarDaySelected,
                        ]}
                        onPress={() => {
                          if (!disabled && day.isCurrentMonth) {
                            setSelectedDate(day.date)
                            setTimeout(() => {
                              loadOccupiedSlots(day.date)
                            }, 100)
                          }
                        }}
                        disabled={disabled || !day.isCurrentMonth}
                      >
                        <Text style={[
                          styles.calendarDayText,
                          !day.isCurrentMonth && styles.calendarDayTextOtherMonth,
                          disabled && styles.calendarDayTextDisabled,
                          isSelected && styles.calendarDayTextSelected,
                        ]}>
                          {day.date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </View>
            </View>

            {/* Time Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Time (10:00 AM - 7:00 PM)</Text>
              {loadingSlots && (
                <Text style={styles.loadingSlotsText}>Checking available times...</Text>
              )}
              {isTimeSlotOccupied(selectedHour, selectedMinute, selectedPeriod) && (
                <View style={styles.occupiedWarning}>
                  <Ionicons name="warning" size={20} color="#ef4444" />
                  <Text style={styles.occupiedWarningText}>
                    This time slot is occupied. Please select another time.
                  </Text>
                </View>
              )}
              <View style={styles.timePicker}>
                <View style={styles.timeColumn}>
                  <ScrollView 
                    style={styles.timeScroll} 
                    contentContainerStyle={styles.timeScrollContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {availableHours.map((timeSlot, i) => {
                      const isOccupied = isTimeSlotOccupied(timeSlot.hour, selectedMinute, timeSlot.period)
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => {
                            setSelectedHour(timeSlot.hour)
                            setSelectedPeriod(timeSlot.period)
                          }}
                          style={styles.timeOption}
                          disabled={isOccupied}
                        >
                          <Text style={[
                            styles.timeText,
                            selectedHour === timeSlot.hour && selectedPeriod === timeSlot.period && styles.timeTextSelected,
                            isOccupied && styles.timeTextOccupied
                          ]}>
                            {timeSlot.hour.toString().padStart(2, '0')}
                            {isOccupied && ' 🚫'}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                <View style={styles.timeColumn}>
                  <ScrollView 
                    style={styles.timeScroll} 
                    contentContainerStyle={styles.timeScrollContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((minute) => {
                      const isOccupied = isTimeSlotOccupied(selectedHour, minute, selectedPeriod)
                      return (
                        <TouchableOpacity
                          key={minute}
                          onPress={() => setSelectedMinute(minute)}
                          style={styles.timeOption}
                          disabled={isOccupied}
                        >
                          <Text style={[
                            styles.timeText,
                            selectedMinute === minute && styles.timeTextSelected,
                            isOccupied && styles.timeTextOccupied
                          ]}>
                            {minute.toString().padStart(2, '0')}
                            {isOccupied && ' 🚫'}
                          </Text>
                        </TouchableOpacity>
                      )
                    })}
                  </ScrollView>
                </View>

                <View style={styles.timeColumn}>
                  <View style={styles.timePeriodContainer}>
                    <Text style={[
                      styles.timeText,
                      styles.timeTextSelected
                    ]}>
                      {selectedPeriod}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mode of Payment</Text>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  paymentMethod === "Cash" && styles.paymentOptionSelected
                ]}
                onPress={() => setPaymentMethod("Cash")}
              >
                <Text style={[
                  styles.paymentText,
                  paymentMethod === "Cash" && styles.paymentTextSelected
                ]}>
                  Cash
                </Text>
                {paymentMethod === "Cash" && (
                  <View style={styles.paymentCheckbox}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  styles.paymentOptionDisabled
                ]}
                disabled={true}
              >
                <Text style={[styles.paymentText, styles.paymentTextDisabled]}>
                  GCash (Coming Soon)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {bookingError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorText}>{bookingError}</Text>
              </View>
            )}

            {/* Book Button */}
            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity 
                style={[styles.confirmButtonFull, isBooking && styles.confirmButtonDisabled]}
                onPress={handleBookAppointmentClick}
                disabled={isBooking}
              >
                {isBooking ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#ffffff" />
                    <Text style={styles.loadingText}>Booking...</Text>
                  </View>
                ) : (
                  <Text style={styles.confirmButtonFullText}>Book Appointment</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Confirmation Modal */}
        <Modal
          visible={showConfirmationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowConfirmationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.warningIconContainer}>
                <View style={styles.warningIconOuter}>
                  <View style={styles.warningIconInner}>
                    <Ionicons name="alert" size={40} color="#ffffff" />
                  </View>
                </View>
              </View>
              
              <Text style={styles.warningTitle}>Important Notice</Text>
              <Text style={styles.warningMessage}>
                Please read and understand our cancellation policy before confirming your appointment.
              </Text>
              
              <View style={styles.policyContainer}>
                <View style={styles.policyItem}>
                  <Ionicons name="calendar" size={18} color="#f59e0b" />
                  <Text style={styles.policyText}>
                    <Text style={styles.policyTextBold}>No Cancellation</Text> within 24 hours before the scheduled appointment time.
                  </Text>
                </View>
                
                <View style={styles.policyItem}>
                  <Ionicons name="time" size={18} color="#f59e0b" />
                  <Text style={styles.policyText}>
                    Please arrive <Text style={styles.policyTextBold}>10 minutes early</Text> to ensure your appointment starts on time.
                  </Text>
                </View>
                
                <View style={styles.policyItem}>
                  <Ionicons name="cash" size={18} color="#f59e0b" />
                  <Text style={styles.policyText}>
                    Payment will be collected <Text style={styles.policyTextBold}>at the salon</Text> after your service is completed.
                  </Text>
                </View>
                
                <View style={styles.policyItem}>
                  <Ionicons name="call" size={18} color="#f59e0b" />
                  <Text style={styles.policyText}>
                    For any concerns, please contact us at least <Text style={styles.policyTextBold}>24 hours in advance</Text>.
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowConfirmationModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.agreeButton}
                  onPress={handleConfirmBooking}
                >
                  <Text style={styles.agreeButtonText}>I Agree</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Success Modal */}
        <Modal
          visible={showSuccessModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSuccessModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.successIconContainer}>
                <View style={styles.successIconOuter}>
                  <View style={styles.successIconInner}>
                    <Text style={styles.successCheckmark}>✓</Text>
                  </View>
                </View>
              </View>
              
              <Text style={styles.congratsText}>Congratulations!</Text>
              <Text style={styles.successMessage}>
                Your appointment for Perfectly Salon has been noted. Please make sure to arrive on the scheduled date and time.
              </Text>
              
              <TouchableOpacity 
                style={styles.viewHomeButton}
                onPress={handleViewMyBooking}
              >
                <Text style={styles.viewHomeButtonText}>View My Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }

  // SERVICE SELECTION STEP
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>← Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.notificationButton} onPress={navigateToNotifications}>
          <Ionicons name="notifications-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{categoryName}</Text>

            {services.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No services available</Text>
              </View>
            ) : (
              services.map((service) => (
                <View key={service.id} style={styles.serviceRow}>
                  <View style={styles.serviceInfo}>
                    <View style={styles.serviceNameContainer}>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      {service.subtitle && (
                        <Text style={styles.serviceSubtitle}>{service.subtitle}</Text>
                      )}
                    </View>
                    <Text style={styles.servicePrice}>₱{parseFloat(service.price).toFixed(0)}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkbox, 
                      selectedServices[service.id] && styles.checkboxSelected
                    ]}
                    onPress={() => toggleService(service.id)}
                  >
                    {selectedServices[service.id] && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {addons.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Add Ons {addons[0]?.is_per_unit && "(Per Unit)"}
              </Text>

              {addons.map((addon) => (
                <View key={addon.id} style={styles.addOnRow}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{addon.name}</Text>
                    <Text style={styles.servicePrice}>₱{parseFloat(addon.price).toFixed(0)}</Text>
                  </View>
                  <View style={styles.quantityControls}>
                    <TouchableOpacity 
                      style={styles.quantityButton} 
                      onPress={() => updateAddonQuantity(addon.id, -1)}
                    >
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>
                      {addonQuantities[addon.id] || 0}
                    </Text>
                    <TouchableOpacity 
                      style={styles.quantityButton} 
                      onPress={() => updateAddonQuantity(addon.id, 1)}
                    >
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.confirmButtonContainer}>
            <TouchableOpacity 
              style={styles.confirmButtonFull}
              onPress={handleConfirmServices}
            >
              <Text style={styles.confirmButtonFullText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.totalFooter, { opacity: fadeAnim }]}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalAmount}>₱ {calculateTotal(selectedServices, addonQuantities, services, addons).toFixed(0)}</Text>
      </Animated.View>
    </SafeAreaView>
  )
}