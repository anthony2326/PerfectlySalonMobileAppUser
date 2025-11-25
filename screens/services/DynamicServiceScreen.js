import { useState, useEffect } from "react"
import { View, Text, Dimensions, Animated, SafeAreaView, TouchableOpacity, ScrollView, Modal, ActivityIndicator, Alert } from "react-native"
import { Ionicons } from '@expo/vector-icons'
import supabase from '../../utils/supabase'
import styles from './DynamicServiceScreen.styles'

const { width } = Dimensions.get("window")

export default function DynamicServiceScreen({ route, navigation, userData }) {
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
  const [selectedHour, setSelectedHour] = useState(9)
  const [selectedMinute, setSelectedMinute] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState("AM")
  const [paymentMethod, setPaymentMethod] = useState("Cash")

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [bookingError, setBookingError] = useState(null)

  useEffect(() => {
    loadServicesData()
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

  const loadServicesData = async () => {
    try {
      setLoading(true)
      
      const { data: categoryData, error: categoryError } = await supabase
        .from('service_categories')
        .select('id')
        .eq('slug', categorySlug)
        .eq('is_active', true)
        .single()

      if (categoryError) throw categoryError
      
      setCategoryId(categoryData.id)

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (servicesError) throw servicesError
      
      setServices(servicesData || [])

      const { data: addonsData, error: addonsError } = await supabase
        .from('service_addons')
        .select('*')
        .eq('category_id', categoryData.id)
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (addonsError && addonsError.code !== 'PGRST116') {
        throw addonsError
      }
      
      setAddons(addonsData || [])

    } catch (error) {
      console.error('[DYNAMIC SERVICE] Error loading services:', error)
      Alert.alert('Error', 'Failed to load services. Please try again.')
    } finally {
      setLoading(false)
    }
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

  const calculateTotal = () => {
    let total = 0

    Object.keys(selectedServices).forEach((serviceId) => {
      if (selectedServices[serviceId]) {
        const service = services.find((s) => s.id === serviceId)
        if (service) {
          total += parseFloat(service.price)
        }
      }
    })

    Object.keys(addonQuantities).forEach((addonId) => {
      const quantity = addonQuantities[addonId] || 0
      if (quantity > 0) {
        const addon = addons.find((a) => a.id === addonId)
        if (addon) {
          total += parseFloat(addon.price) * quantity
        }
      }
    })

    return total
  }

  const getSelectedServicesList = () => {
    const servicesList = []
    
    Object.keys(selectedServices).forEach((serviceId) => {
      if (selectedServices[serviceId]) {
        const service = services.find((s) => s.id === serviceId)
        if (service) {
          const displayName = service.subtitle 
            ? `${service.name} (${service.subtitle})` 
            : service.name
          servicesList.push({ 
            name: displayName, 
            price: parseFloat(service.price) 
          })
        }
      }
    })

    Object.keys(addonQuantities).forEach((addonId) => {
      const quantity = addonQuantities[addonId] || 0
      if (quantity > 0) {
        const addon = addons.find((a) => a.id === addonId)
        if (addon) {
          servicesList.push({ 
            name: `${addon.name} (x${quantity})`, 
            price: parseFloat(addon.price) * quantity 
          })
        }
      }
    })

    return servicesList
  }

  const handleConfirmServices = () => {
    const total = calculateTotal()
    if (total > 0) {
      setBookingStep("appointment")
      setSelectedDate(new Date())
    } else {
      Alert.alert("No Services Selected", "Please select at least one service to continue.")
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1)
      days.push({ date: prevMonthDay, isCurrentMonth: false })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }

    const remainingCells = 42 - days.length
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
    }

    return days
  }

  const changeMonth = (direction) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1))
  }

  const isDateDisabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    return compareDate < today
  }

  const handleBookAppointment = async () => {
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

    if (paymentMethod !== "Cash") {
      setBookingError("Only Cash payment is currently available")
      return
    }

    setIsBooking(true)
    setBookingError(null)

    try {
      const servicesList = getSelectedServicesList()
      const total = calculateTotal()
      const orderNumber = `ORD-${Date.now()}`
      
      const formattedDate = selectedDate.toISOString().split('T')[0]
      const formattedTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`

      const bookingData = {
        order_number: orderNumber,
        user_id: userData.id,
        client_name: userData.name || userData.username,
        client_email: userData.email,
        client_phone: userData.contactNumber || 'N/A',
        services: servicesList,
        stylist: 'To be assigned',
        appointment_date: formattedDate,
        appointment_time: formattedTime,
        duration: null,
        total_amount: total,
        payment_method: paymentMethod,
        status: 'pending',
        notes: null
      }

      console.log('[DYNAMIC BOOKING] Booking data:', bookingData)

      const { data, error } = await supabase
        .from('appointments')
        .insert([bookingData])
        .select()

      if (error) throw error

      console.log('[DYNAMIC BOOKING] Booking successful:', data)
      setShowSuccessModal(true)
      
    } catch (error) {
      console.error('[DYNAMIC BOOKING] Error:', error)
      setBookingError(error.message || 'Failed to book appointment. Please try again.')
      Alert.alert("Booking Failed", error.message || 'Failed to book appointment. Please try again.')
    } finally {
      setIsBooking(false)
    }
  }

  const handleViewHome = () => {
    setShowSuccessModal(false)
    setSelectedServices({})
    setAddonQuantities({})
    setBookingStep("services")
    setSelectedDate(null)
    setSelectedHour(9)
    setSelectedMinute(0)
    setSelectedPeriod("AM")
    setPaymentMethod("Cash")
    navigation.navigate("Services")
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
    const servicesList = getSelectedServicesList()
    const total = calculateTotal()
    const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Date</Text>
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
                    const isDisabled = isDateDisabled(day.date)
                    const isSelected = selectedDate && 
                      day.date.toDateString() === selectedDate.toDateString()
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.calendarDay,
                          !day.isCurrentMonth && styles.calendarDayOtherMonth,
                          isDisabled && styles.calendarDayDisabled,
                          isSelected && styles.calendarDaySelected,
                        ]}
                        onPress={() => !isDisabled && day.isCurrentMonth && setSelectedDate(day.date)}
                        disabled={isDisabled || !day.isCurrentMonth}
                      >
                        <Text style={[
                          styles.calendarDayText,
                          !day.isCurrentMonth && styles.calendarDayTextOtherMonth,
                          isDisabled && styles.calendarDayTextDisabled,
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose Time</Text>
              <View style={styles.timePicker}>
                <View style={styles.timeColumn}>
                  <ScrollView 
                    style={styles.timeScroll} 
                    contentContainerStyle={styles.timeScrollContent}
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {[...Array(12)].map((_, i) => {
                      const hour = i + 1
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setSelectedHour(hour)}
                          style={styles.timeOption}
                        >
                          <Text style={[
                            styles.timeText,
                            selectedHour === hour && styles.timeTextSelected
                          ]}>
                            {hour.toString().padStart(2, '0')}
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
                    {[0, 15, 30, 45].map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        onPress={() => setSelectedMinute(minute)}
                        style={styles.timeOption}
                      >
                        <Text style={[
                          styles.timeText,
                          selectedMinute === minute && styles.timeTextSelected
                        ]}>
                          {minute.toString().padStart(2, '0')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.timeColumn}>
                  <View style={styles.timePeriodContainer}>
                    <TouchableOpacity
                      onPress={() => setSelectedPeriod("AM")}
                      style={styles.timeOption}
                    >
                      <Text style={[
                        styles.timeText,
                        selectedPeriod === "AM" && styles.timeTextSelected
                      ]}>
                        AM
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setSelectedPeriod("PM")}
                      style={styles.timeOption}
                    >
                      <Text style={[
                        styles.timeText,
                        selectedPeriod === "PM" && styles.timeTextSelected
                      ]}>
                        PM
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

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

            {bookingError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#dc2626" />
                <Text style={styles.errorText}>{bookingError}</Text>
              </View>
            )}

            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity 
                style={[styles.confirmButtonFull, isBooking && styles.confirmButtonDisabled]}
                onPress={handleBookAppointment}
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
                onPress={handleViewHome}
              >
                <Text style={styles.viewHomeButtonText}>View Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }

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
        <Text style={styles.totalAmount}>₱ {calculateTotal().toFixed(0)}</Text>
      </Animated.View>
    </SafeAreaView>
  )
}