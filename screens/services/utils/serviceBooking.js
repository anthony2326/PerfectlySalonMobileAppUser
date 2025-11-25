// Utility functions for service booking

/**
 * Calculate total price from selected services and addons
 */
export const calculateTotal = (selectedServices, addonQuantities, services, addons) => {
  let total = 0

  // Calculate services total
  Object.keys(selectedServices).forEach((serviceId) => {
    if (selectedServices[serviceId]) {
      const service = services.find((s) => s.id === serviceId)
      if (service) {
        total += parseFloat(service.price)
      }
    }
  })

  // Calculate addons total
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

/**
 * Get list of selected services with their details
 */
export const getSelectedServicesList = (selectedServices, addonQuantities, services, addons) => {
  const servicesList = []
  
  // Add selected services
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

  // Add selected addons
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

/**
 * Format booking data for database insertion
 */
export const formatBookingData = (userData, servicesList, total, selectedDate, selectedHour, selectedMinute, selectedPeriod, paymentMethod) => {
  const orderNumber = `ORD-${Date.now()}`
  const formattedDate = selectedDate.toISOString().split('T')[0]
  const formattedTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')} ${selectedPeriod}`

  return {
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
}

/**
 * Reset booking state to initial values
 */
export const getInitialBookingState = () => ({
  selectedServices: {},
  addonQuantities: {},
  bookingStep: "services",
  selectedDate: null,
  selectedHour: 9,
  selectedMinute: 0,
  selectedPeriod: "AM",
  paymentMethod: "Cash"
})