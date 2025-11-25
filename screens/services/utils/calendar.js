// Calendar utility functions

/**
 * Get all days to display in calendar grid (42 days - 6 weeks)
 * Includes days from previous and next months to fill the grid
 */
export const getDaysInMonth = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  const days = []
  
  // Add days from previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
    const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1)
    days.push({ date: prevMonthDay, isCurrentMonth: false })
  }

  // Add days from current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true })
  }

  // Add days from next month to complete the grid (42 days total)
  const remainingCells = 42 - days.length
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false })
  }

  return days
}

/**
 * Check if a date is in the past (should be disabled)
 */
export const isDateDisabled = (date) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  return compareDate < today
}

/**
 * Change month by direction (-1 for previous, 1 for next)
 */
export const changeMonth = (currentMonth, direction) => {
  return new Date(
    currentMonth.getFullYear(), 
    currentMonth.getMonth() + direction, 
    1
  )
}

/**
 * Format month and year for display
 */
export const formatMonthYear = (date) => {
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  })
}