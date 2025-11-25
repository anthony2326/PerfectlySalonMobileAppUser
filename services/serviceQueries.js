// utils/serviceQueries.js
// Helper functions for service-related database operations

import supabase from './supabase'

/**
 * Get all active service categories
 */
export const getServiceCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching categories:', error)
    return { data: null, error }
  }
}

/**
 * Get services by category slug
 */
export const getServicesByCategory = async (categorySlug) => {
  try {
    // First get the category ID
    const { data: category, error: categoryError } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single()

    if (categoryError) throw categoryError

    // Then get services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (servicesError) throw servicesError

    return { data: services, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching services:', error)
    return { data: null, error }
  }
}

/**
 * Get add-ons by category slug
 */
export const getAddonsByCategory = async (categorySlug) => {
  try {
    // First get the category ID
    const { data: category, error: categoryError } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single()

    if (categoryError) throw categoryError

    // Then get add-ons
    const { data: addons, error: addonsError } = await supabase
      .from('service_addons')
      .select('*')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (addonsError && addonsError.code !== 'PGRST116') {
      throw addonsError
    }

    return { data: addons || [], error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching add-ons:', error)
    return { data: [], error }
  }
}

/**
 * Get complete category with services and add-ons
 */
export const getCategoryComplete = async (categorySlug) => {
  try {
    const { data: category, error: categoryError } = await supabase
      .from('service_categories')
      .select('*')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single()

    if (categoryError) throw categoryError

    // Get services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (servicesError) throw servicesError

    // Get add-ons
    const { data: addons } = await supabase
      .from('service_addons')
      .select('*')
      .eq('category_id', category.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    return {
      data: {
        category,
        services: services || [],
        addons: addons || []
      },
      error: null
    }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching category complete:', error)
    return { data: null, error }
  }
}

/**
 * Search services across all categories
 */
export const searchServices = async (searchTerm) => {
  try {
    const { data, error } = await supabase
      .from('services_with_category') // Using the view we created
      .select('*')
      .or(`name.ilike.%${searchTerm}%,category_name.ilike.%${searchTerm}%`)
      .limit(20)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error searching services:', error)
    return { data: null, error }
  }
}

/**
 * Get services by price range
 */
export const getServicesByPriceRange = async (minPrice, maxPrice) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*, service_categories(name, slug)')
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching by price range:', error)
    return { data: null, error }
  }
}

/**
 * Get popular services (you'll need to add a popularity metric)
 */
export const getPopularServices = async (limit = 10) => {
  try {
    // This would need a 'booking_count' or 'popularity_score' field
    const { data, error } = await supabase
      .from('services')
      .select('*, service_categories(name, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }) // Placeholder ordering
      .limit(limit)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching popular services:', error)
    return { data: null, error }
  }
}

/**
 * ADMIN FUNCTIONS (require admin authentication)
 */

/**
 * Create new service category
 */
export const createServiceCategory = async (categoryData) => {
  try {
    const { data, error } = await supabase
      .from('service_categories')
      .insert([categoryData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error creating category:', error)
    return { data: null, error }
  }
}

/**
 * Create new service
 */
export const createService = async (serviceData) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .insert([serviceData])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error creating service:', error)
    return { data: null, error }
  }
}

/**
 * Update service
 */
export const updateService = async (serviceId, updates) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error updating service:', error)
    return { data: null, error }
  }
}

/**
 * Delete (deactivate) service
 */
export const deleteService = async (serviceId) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: false })
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error deleting service:', error)
    return { data: null, error }
  }
}

/**
 * Update service prices in bulk
 */
export const bulkUpdatePrices = async (categoryId, priceMultiplier) => {
  try {
    // Get all services in category
    const { data: services, error: fetchError } = await supabase
      .from('services')
      .select('id, price')
      .eq('category_id', categoryId)
      .eq('is_active', true)

    if (fetchError) throw fetchError

    // Update each service
    const updates = services.map(service => ({
      id: service.id,
      price: (parseFloat(service.price) * priceMultiplier).toFixed(2)
    }))

    const { data, error } = await supabase
      .from('services')
      .upsert(updates)

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error bulk updating prices:', error)
    return { data: null, error }
  }
}

/**
 * Reorder services
 */
export const reorderServices = async (serviceId, newDisplayOrder) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .update({ display_order: newDisplayOrder })
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error reordering service:', error)
    return { data: null, error }
  }
}

/**
 * Toggle service active status
 */
export const toggleServiceStatus = async (serviceId) => {
  try {
    // Get current status
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('is_active')
      .eq('id', serviceId)
      .single()

    if (fetchError) throw fetchError

    // Toggle status
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: !service.is_active })
      .eq('id', serviceId)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error toggling service status:', error)
    return { data: null, error }
  }
}

/**
 * Get service statistics
 */
export const getServiceStats = async (serviceId) => {
  try {
    // Get booking count for this service
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('services')
      .contains('services', [{ id: serviceId }])

    if (error) throw error

    return {
      data: {
        totalBookings: appointments?.length || 0,
        // Add more stats as needed
      },
      error: null
    }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching service stats:', error)
    return { data: null, error }
  }
}

/**
 * Duplicate a service
 */
export const duplicateService = async (serviceId) => {
  try {
    // Get original service
    const { data: original, error: fetchError } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single()

    if (fetchError) throw fetchError

    // Create duplicate with modified name
    const duplicate = {
      ...original,
      id: undefined, // Remove ID so new one is generated
      name: `${original.name} (Copy)`,
      created_at: undefined,
      updated_at: undefined
    }

    const { data, error } = await supabase
      .from('services')
      .insert([duplicate])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error duplicating service:', error)
    return { data: null, error }
  }
}

/**
 * ANALYTICS & REPORTING
 */

/**
 * Get category revenue report
 */
export const getCategoryRevenue = async (startDate, endDate) => {
  try {
    const { data, error } = await supabase
      .rpc('get_category_revenue', {
        start_date: startDate,
        end_date: endDate
      })

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching category revenue:', error)
    return { data: null, error }
  }
}

/**
 * Get most booked services
 */
export const getMostBookedServices = async (limit = 10, days = 30) => {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('services')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'completed')

    if (error) throw error

    // Count service bookings
    const serviceCounts = {}
    appointments?.forEach(apt => {
      apt.services?.forEach(service => {
        const key = service.name
        serviceCounts[key] = (serviceCounts[key] || 0) + 1
      })
    })

    // Sort and limit
    const sorted = Object.entries(serviceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({ name, count }))

    return { data: sorted, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error fetching most booked services:', error)
    return { data: null, error }
  }
}

/**
 * UTILITY FUNCTIONS
 */

/**
 * Validate service data before insert/update
 */
export const validateServiceData = (serviceData) => {
  const errors = []

  if (!serviceData.name || serviceData.name.trim() === '') {
    errors.push('Service name is required')
  }

  if (!serviceData.price || parseFloat(serviceData.price) <= 0) {
    errors.push('Valid price is required')
  }

  if (!serviceData.category_id) {
    errors.push('Category is required')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Format price for display
 */
export const formatPrice = (price) => {
  return `₱${parseFloat(price).toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`
}

/**
 * Calculate service bundle discount
 */
export const calculateBundleDiscount = (services, discountPercent = 10) => {
  const total = services.reduce((sum, service) => sum + parseFloat(service.price), 0)
  const discount = total * (discountPercent / 100)
  return {
    originalTotal: total,
    discount,
    finalTotal: total - discount,
    savings: discount
  }
}

/**
 * Check if service is available for booking
 */
export const isServiceAvailable = async (serviceId) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('is_active')
      .eq('id', serviceId)
      .single()

    if (error) throw error
    return data.is_active
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error checking service availability:', error)
    return false
  }
}

/**
 * Get recommended services based on booking history
 */
export const getRecommendedServices = async (userId, limit = 5) => {
  try {
    // Get user's booking history
    const { data: appointments, error: aptError } = await supabase
      .from('appointments')
      .select('services')
      .eq('user_id', userId)
      .limit(10)

    if (aptError) throw aptError

    // Extract booked service categories
    const bookedCategories = new Set()
    appointments?.forEach(apt => {
      apt.services?.forEach(service => {
        // Extract category from service name (you might need to adjust this)
        bookedCategories.add(service.name.split(' ')[0])
      })
    })

    // Get services from same categories that user hasn't booked yet
    // This is a simplified recommendation - you can make it more sophisticated
    const { data: recommended, error } = await supabase
      .from('services')
      .select('*, service_categories(name, slug)')
      .eq('is_active', true)
      .limit(limit)

    if (error) throw error
    return { data: recommended, error: null }
  } catch (error) {
    console.error('[SERVICE_QUERIES] Error getting recommendations:', error)
    return { data: null, error }
  }
}

/**
 * CACHE HELPERS (Optional - for performance)
 */

let categoryCache = null
let categoryCacheTime = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get categories with caching
 */
export const getCachedCategories = async (forceRefresh = false) => {
  const now = Date.now()
  
  if (!forceRefresh && categoryCache && categoryCacheTime && (now - categoryCacheTime < CACHE_DURATION)) {
    console.log('[SERVICE_QUERIES] Returning cached categories')
    return { data: categoryCache, error: null }
  }

  const result = await getServiceCategories()
  
  if (result.data) {
    categoryCache = result.data
    categoryCacheTime = now
  }

  return result
}

/**
 * Clear all caches
 */
export const clearServiceCache = () => {
  categoryCache = null
  categoryCacheTime = null
  console.log('[SERVICE_QUERIES] Cache cleared')
}

/**
 * REAL-TIME SUBSCRIPTIONS
 */

/**
 * Subscribe to service changes
 */
export const subscribeToServiceChanges = (categoryId, callback) => {
  const channel = supabase
    .channel(`services-${categoryId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'services',
        filter: `category_id=eq.${categoryId}`
      },
      (payload) => {
        console.log('[SERVICE_QUERIES] Service change:', payload)
        callback(payload)
      }
    )
    .subscribe()

  return channel
}

/**
 * Subscribe to category changes
 */
export const subscribeToCategoryChanges = (callback) => {
  const channel = supabase
    .channel('service-categories')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'service_categories'
      },
      (payload) => {
        console.log('[SERVICE_QUERIES] Category change:', payload)
        clearServiceCache() // Clear cache on change
        callback(payload)
      }
    )
    .subscribe()

  return channel
}

/**
 * Unsubscribe from channel
 */
export const unsubscribe = (channel) => {
  if (channel) {
    supabase.removeChannel(channel)
  }
}

// Export all functions as default object as well
export default {
  // Read operations
  getServiceCategories,
  getServicesByCategory,
  getAddonsByCategory,
  getCategoryComplete,
  searchServices,
  getServicesByPriceRange,
  getPopularServices,
  
  // Admin operations
  createServiceCategory,
  createService,
  updateService,
  deleteService,
  bulkUpdatePrices,
  reorderServices,
  toggleServiceStatus,
  getServiceStats,
  duplicateService,
  
  // Analytics
  getCategoryRevenue,
  getMostBookedServices,
  getRecommendedServices,
  
  // Utilities
  validateServiceData,
  formatPrice,
  calculateBundleDiscount,
  isServiceAvailable,
  
  // Caching
  getCachedCategories,
  clearServiceCache,
  
  // Real-time
  subscribeToServiceChanges,
  subscribeToCategoryChanges,
  unsubscribe
}