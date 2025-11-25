// Validation utility functions
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim().toLowerCase())
}

export const validatePhone = (phone) => {
  const cleanPhone = phone.replace(/[\s-()]/g, "")
  const phoneRegex = /^[0-9]{11}$/
  return phoneRegex.test(cleanPhone)
}

export const validateUsername = (username) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username.trim())
}

export const validateAge = (age) => {
  const ageNum = Number.parseInt(age)
  return !isNaN(ageNum) && ageNum >= 13 && ageNum <= 120
}

export const validatePassword = (password) => {
  return password.length >= 6
}
