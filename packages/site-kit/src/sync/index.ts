/**
 * Sync Module - Booking Widget for Client Sites
 * 
 * Provides embeddable booking functionality for client websites
 * that connects to the Sync scheduling system.
 * 
 * @example
 * ```tsx
 * import { BookingWidget } from '@uptrade/site-kit'
 * 
 * export default function BookingPage() {
 *   return (
 *     <BookingWidget
 *       orgSlug="your-org-slug"
 *       bookingTypeSlug="consultation" // optional
 *       onBookingComplete={(result) => {
 *         console.log('Booking confirmed:', result)
 *       }}
 *     />
 *   )
 * }
 * ```
 */

// Main Component
export { BookingWidget, default } from './BookingWidget'

// API Functions (for custom implementations)
export {
  fetchBookingTypes,
  fetchBookingTypeDetails,
  fetchAvailability,
  fetchAvailableDates,
  createSlotHold,
  releaseSlotHold,
  createBooking,
  detectTimezone,
  formatTime,
  formatDate,
  formatDuration,
} from './api'

// Types
export type {
  BookingType,
  TimeSlot,
  Host,
  SlotHold,
  BookingResult,
  BookingWidgetProps,
  DatePickerProps,
  TimeSlotPickerProps,
  BookingFormProps,
  GuestInfo,
  SyncWidgetConfig,
} from './types'
