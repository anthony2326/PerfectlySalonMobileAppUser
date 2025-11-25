import supabase from '../utils/supabase'

/**
 * Load service category, services, and addons from database
 */
export const loadServicesData = async (categorySlug) => {
  try {
    // Get category ID
    const { data: categoryData, error: categoryError } = await supabase
      .from('service_categories')
      .select('id')
      .eq('slug', categorySlug)
      .eq('is_active', true)
      .single()

    if (categoryError) throw categoryError

    // Get services for this category
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('category_id', categoryData.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (servicesError) throw servicesError

    // Get add-ons for this category (if any)
    const { data: addonsData, error: addonsError } = await supabase
      .from('service_addons')
      .select('*')
      .eq('category_id', categoryData.id)
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    // Ignore "no rows returned" error for addons
    if (addonsError && addonsError.code !== 'PGRST116') {
      throw addonsError
    }

    return {
      categoryId: categoryData.id,
      services: servicesData || [],
      addons: addonsData || []
    }
  } catch (error) {
    console.error('[SERVICE BOOKING API] Error loading services:', error)
    throw error
  }
}

/**
 * Create a new appointment booking
 */
export const createAppointment = async (bookingData) => {
  try {
    console.log('[SERVICE BOOKING API] Creating booking:', bookingData)

    const { data, error } = await supabase
      .from('appointments')
      .insert([bookingData])
      .select()

    if (error) throw error

    console.log('[SERVICE BOOKING API] Booking successful:', data)
    return data
  } catch (error) {
    console.error('[SERVICE BOOKING API] Error creating appointment:', error)
    throw error
  }
}