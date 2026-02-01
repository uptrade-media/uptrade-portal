/**
 * Sync API Functions - Client-side API calls for booking widget
 */

import type { 
  BookingType, 
  TimeSlot, 
  SlotHold, 
  BookingResult,
  GuestInfo,
} from './types'

const DEFAULT_API_URL = 'https://api.uptrademedia.com'

/**
 * Fetch public booking types for an organization
 */
export async function fetchBookingTypes(
  orgSlug: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<BookingType[]> {
  const response = await fetch(`${apiUrl}/sync/public/${orgSlug}/types`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch booking types: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.types || []
}

/**
 * Fetch booking type details
 */
export async function fetchBookingTypeDetails(
  orgSlug: string,
  typeSlug: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<BookingType> {
  const response = await fetch(`${apiUrl}/sync/public/${orgSlug}/types/${typeSlug}`)
  
  if (!response.ok) {
    throw new Error(`Failed to fetch booking type: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Fetch available time slots for a specific date
 */
export async function fetchAvailability(
  orgSlug: string,
  typeSlug: string,
  date: string, // YYYY-MM-DD format
  apiUrl: string = DEFAULT_API_URL,
  timezone?: string,
  hostId?: string
): Promise<TimeSlot[]> {
  const params = new URLSearchParams({ date })
  if (timezone) params.append('timezone', timezone)
  if (hostId) params.append('hostId', hostId)
  
  const response = await fetch(
    `${apiUrl}/sync/public/${orgSlug}/availability/${typeSlug}?${params}`
  )
  
  if (!response.ok) {
    throw new Error(`Failed to fetch availability: ${response.statusText}`)
  }
  
  const data = await response.json()
  return data.slots || []
}

/**
 * Hold a time slot temporarily (5-10 minutes)
 */
export async function createSlotHold(
  bookingTypeId: string,
  startTime: string,
  hostId: string | undefined,
  guestTimezone: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<SlotHold> {
  const response = await fetch(`${apiUrl}/sync/public/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booking_type_id: bookingTypeId,
      start_time: startTime,
      host_id: hostId,
      guest_timezone: guestTimezone,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`Failed to hold slot: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Release a slot hold
 */
export async function releaseSlotHold(
  holdId: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<void> {
  await fetch(`${apiUrl}/sync/public/hold/${holdId}`, {
    method: 'DELETE',
  })
}

/**
 * Create a booking
 */
export async function createBooking(
  bookingTypeId: string,
  startTime: string,
  guest: GuestInfo,
  timezone: string,
  hostId?: string,
  holdId?: string,
  apiUrl: string = DEFAULT_API_URL
): Promise<BookingResult> {
  const response = await fetch(`${apiUrl}/sync/public/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      booking_type_id: bookingTypeId,
      start_time: startTime,
      guest_name: guest.name,
      guest_email: guest.email,
      guest_phone: guest.phone,
      guest_notes: guest.notes,
      timezone,
      host_id: hostId,
      hold_id: holdId,
    }),
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Failed to create booking: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Get available dates for a month (helper for calendar view)
 * Returns dates that have at least one available slot
 */
export async function fetchAvailableDates(
  orgSlug: string,
  typeSlug: string,
  startDate: string, // YYYY-MM-DD
  endDate: string,   // YYYY-MM-DD
  apiUrl: string = DEFAULT_API_URL,
  timezone?: string
): Promise<string[]> {
  // Fetch availability for each day in range
  // In production, this would be a single API call
  const availableDates: string[] = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  const current = new Date(start)
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0]
    
    try {
      const slots = await fetchAvailability(orgSlug, typeSlug, dateStr, apiUrl, timezone)
      if (slots.some(s => s.available)) {
        availableDates.push(dateStr)
      }
    } catch {
      // Skip dates that fail to load
    }
    
    current.setDate(current.getDate() + 1)
  }
  
  return availableDates
}

/**
 * Detect user's timezone
 */
export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/New_York'
  }
}

/**
 * Format time for display
 */
export function formatTime(isoString: string, timezone: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  })
}

/**
 * Format date for display
 */
export function formatDate(isoString: string, timezone: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: timezone,
  })
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }
  return `${hours}h ${mins}m`
}
