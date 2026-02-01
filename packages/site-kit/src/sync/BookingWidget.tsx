'use client'

/**
 * BookingWidget - Embeddable booking widget for client sites
 * 
 * A full-featured booking widget that allows visitors to:
 * 1. Select a booking type (consultation, meeting, etc.)
 * 2. Pick an available date and time
 * 3. Enter their contact information
 * 4. Confirm the booking
 * 
 * @example
 * ```tsx
 * import { BookingWidget } from '@uptrade/site-kit'
 * 
 * export default function ContactPage() {
 *   return (
 *     <BookingWidget
 *       orgSlug="heinrich-law"
 *       bookingTypeSlug="consultation"
 *       onBookingComplete={(result) => console.log('Booked!', result)}
 *     />
 *   )
 * }
 * ```
 */

import * as React from 'react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { 
  BookingWidgetProps, 
  BookingType, 
  TimeSlot, 
  GuestInfo,
  BookingResult,
  SlotHold,
} from './types'
import {
  fetchBookingTypes,
  fetchBookingTypeDetails,
  fetchAvailability,
  createSlotHold,
  releaseSlotHold,
  createBooking,
  detectTimezone,
  formatTime,
  formatDate,
  formatDuration,
} from './api'

const DEFAULT_API_URL = 'https://api.uptrademedia.com'

// Steps in the booking flow
type BookingStep = 'type' | 'datetime' | 'form' | 'confirm' | 'success'

export function BookingWidget({
  orgSlug,
  apiUrl = DEFAULT_API_URL,
  bookingTypeSlug,
  timezone: propTimezone,
  className = '',
  daysToShow = 14,
  onBookingComplete,
  onError,
  hideTypeSelector = false,
  styles = {},
}: BookingWidgetProps) {
  // State
  const [step, setStep] = useState<BookingStep>(bookingTypeSlug ? 'datetime' : 'type')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Data state
  const [bookingTypes, setBookingTypes] = useState<BookingType[]>([])
  const [selectedType, setSelectedType] = useState<BookingType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [hold, setHold] = useState<SlotHold | null>(null)
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({ name: '', email: '' })
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null)
  
  // Timezone
  const timezone = useMemo(() => propTimezone || detectTimezone(), [propTimezone])
  
  // Generate dates for the date picker
  const availableDates = useMemo(() => {
    const dates: Date[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      // Skip weekends (optional - could be controlled by booking type)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push(date)
      }
    }
    return dates
  }, [daysToShow])

  // Load booking types on mount
  useEffect(() => {
    if (bookingTypeSlug) {
      // Load specific booking type
      fetchBookingTypeDetails(orgSlug, bookingTypeSlug, apiUrl)
        .then(type => {
          setSelectedType(type)
          setStep('datetime')
        })
        .catch(err => {
          setError(err.message)
          onError?.(err)
        })
    } else {
      // Load all booking types
      fetchBookingTypes(orgSlug, apiUrl)
        .then(types => setBookingTypes(types.filter(t => t.is_active)))
        .catch(err => {
          setError(err.message)
          onError?.(err)
        })
    }
  }, [orgSlug, bookingTypeSlug, apiUrl, onError])

  // Load availability when date changes
  useEffect(() => {
    if (!selectedDate || !selectedType) return
    
    const dateStr = selectedDate.toISOString().split('T')[0]
    setLoading(true)
    setSlots([])
    setSelectedSlot(null)
    
    fetchAvailability(orgSlug, selectedType.slug, dateStr, apiUrl, timezone)
      .then(s => setSlots(s.filter(slot => slot.available)))
      .catch(err => {
        setError(err.message)
        onError?.(err)
      })
      .finally(() => setLoading(false))
  }, [selectedDate, selectedType, orgSlug, apiUrl, timezone, onError])

  // Handle slot selection - create hold
  const handleSlotSelect = useCallback(async (slot: TimeSlot) => {
    if (!selectedType) return
    
    // Release previous hold
    if (hold) {
      await releaseSlotHold(hold.holdId, apiUrl).catch(() => {})
    }
    
    setSelectedSlot(slot)
    setLoading(true)
    
    try {
      const newHold = await createSlotHold(
        selectedType.id,
        slot.start,
        slot.hostId,
        timezone,
        apiUrl
      )
      setHold(newHold)
      setStep('form')
    } catch (err: any) {
      setError(err.message)
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [selectedType, hold, timezone, apiUrl, onError])

  // Handle booking submission
  const handleBookingSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || !selectedSlot) return
    
    setLoading(true)
    setError(null)
    
    try {
      const result = await createBooking(
        selectedType.id,
        selectedSlot.start,
        guestInfo,
        timezone,
        selectedSlot.hostId,
        hold?.holdId,
        apiUrl
      )
      
      setBookingResult(result)
      setStep('success')
      onBookingComplete?.(result)
    } catch (err: any) {
      setError(err.message)
      onError?.(err)
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedSlot, guestInfo, timezone, hold, apiUrl, onBookingComplete, onError])

  // Cleanup hold on unmount
  useEffect(() => {
    return () => {
      if (hold) {
        releaseSlotHold(hold.holdId, apiUrl).catch(() => {})
      }
    }
  }, [hold, apiUrl])

  // CSS custom properties for theming
  const cssVars = {
    '--booking-primary': styles.primaryColor || '#4bbf39',
    '--booking-radius': styles.borderRadius || '8px',
    '--booking-font': styles.fontFamily || 'inherit',
  } as React.CSSProperties

  return (
    <div 
      className={`uptrade-booking-widget ${className}`} 
      style={cssVars}
    >
      {/* Error Display */}
      {error && (
        <div className="uptrade-booking-error">
          {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Step 1: Booking Type Selection */}
      {step === 'type' && !hideTypeSelector && (
        <div className="uptrade-booking-types">
          <h3 className="uptrade-booking-title">Select a Service</h3>
          <div className="uptrade-booking-type-list">
            {bookingTypes.map(type => (
              <button
                key={type.id}
                className="uptrade-booking-type-card"
                onClick={() => {
                  setSelectedType(type)
                  setStep('datetime')
                }}
              >
                <div className="uptrade-booking-type-name">{type.name}</div>
                {type.description && (
                  <div className="uptrade-booking-type-desc">{type.description}</div>
                )}
                <div className="uptrade-booking-type-meta">
                  <span>{formatDuration(type.duration_minutes)}</span>
                  {type.price_cents ? (
                    <span>${(type.price_cents / 100).toFixed(2)}</span>
                  ) : (
                    <span>Free</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Time Selection */}
      {step === 'datetime' && selectedType && (
        <div className="uptrade-booking-datetime">
          <button 
            className="uptrade-booking-back"
            onClick={() => {
              if (bookingTypeSlug) return
              setSelectedType(null)
              setStep('type')
            }}
            disabled={!!bookingTypeSlug}
          >
            ← Back
          </button>
          
          <h3 className="uptrade-booking-title">{selectedType.name}</h3>
          <p className="uptrade-booking-subtitle">
            {formatDuration(selectedType.duration_minutes)} • {selectedType.location_type}
          </p>

          {/* Date Picker */}
          <div className="uptrade-booking-dates">
            <h4>Select a Date</h4>
            <div className="uptrade-booking-date-grid">
              {availableDates.map(date => {
                const dateStr = date.toISOString().split('T')[0]
                const isSelected = selectedDate?.toISOString().split('T')[0] === dateStr
                
                return (
                  <button
                    key={dateStr}
                    className={`uptrade-booking-date ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(date)}
                  >
                    <span className="uptrade-booking-date-day">
                      {date.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="uptrade-booking-date-num">
                      {date.getDate()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div className="uptrade-booking-times">
              <h4>Select a Time</h4>
              {loading ? (
                <div className="uptrade-booking-loading">Loading available times...</div>
              ) : slots.length === 0 ? (
                <div className="uptrade-booking-empty">No times available on this date</div>
              ) : (
                <div className="uptrade-booking-time-grid">
                  {slots.map(slot => (
                    <button
                      key={slot.start}
                      className={`uptrade-booking-time ${selectedSlot?.start === slot.start ? 'selected' : ''}`}
                      onClick={() => handleSlotSelect(slot)}
                      disabled={loading}
                    >
                      {formatTime(slot.start, timezone)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Guest Information Form */}
      {step === 'form' && selectedType && selectedSlot && (
        <div className="uptrade-booking-form">
          <button 
            className="uptrade-booking-back"
            onClick={() => setStep('datetime')}
          >
            ← Back
          </button>
          
          <h3 className="uptrade-booking-title">Your Information</h3>
          <p className="uptrade-booking-subtitle">
            {selectedType.name} on {formatDate(selectedSlot.start, timezone)} at {formatTime(selectedSlot.start, timezone)}
          </p>
          
          {hold && (
            <p className="uptrade-booking-hold-notice">
              This time is held for you for {Math.floor((new Date(hold.expiresAt).getTime() - Date.now()) / 60000)} minutes
            </p>
          )}

          <form onSubmit={handleBookingSubmit}>
            <div className="uptrade-booking-field">
              <label htmlFor="guest-name">Name *</label>
              <input
                id="guest-name"
                type="text"
                required
                value={guestInfo.name}
                onChange={e => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
              />
            </div>
            
            <div className="uptrade-booking-field">
              <label htmlFor="guest-email">Email *</label>
              <input
                id="guest-email"
                type="email"
                required
                value={guestInfo.email}
                onChange={e => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            
            <div className="uptrade-booking-field">
              <label htmlFor="guest-phone">Phone</label>
              <input
                id="guest-phone"
                type="tel"
                value={guestInfo.phone || ''}
                onChange={e => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="uptrade-booking-field">
              <label htmlFor="guest-notes">Additional Notes</label>
              <textarea
                id="guest-notes"
                value={guestInfo.notes || ''}
                onChange={e => setGuestInfo(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anything you'd like us to know..."
                rows={3}
              />
            </div>
            
            <button
              type="submit"
              className="uptrade-booking-submit"
              disabled={loading}
            >
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 'success' && bookingResult && (
        <div className="uptrade-booking-success">
          <div className="uptrade-booking-success-icon">✓</div>
          <h3 className="uptrade-booking-title">Booking Confirmed!</h3>
          <p className="uptrade-booking-confirmation-code">
            Confirmation: {bookingResult.booking.confirmationCode}
          </p>
          
          <div className="uptrade-booking-details">
            <p><strong>When:</strong> {formatDate(bookingResult.booking.scheduledAt, timezone)} at {formatTime(bookingResult.booking.scheduledAt, timezone)}</p>
            <p><strong>Duration:</strong> {formatDuration(bookingResult.booking.durationMinutes)}</p>
            {bookingResult.booking.hostName && (
              <p><strong>With:</strong> {bookingResult.booking.hostName}</p>
            )}
          </div>
          
          <div className="uptrade-booking-calendar-links">
            <p>Add to calendar:</p>
            <div className="uptrade-booking-calendar-buttons">
              <a 
                href={bookingResult.calendarLinks.google} 
                target="_blank" 
                rel="noopener noreferrer"
                className="uptrade-booking-calendar-btn"
              >
                Google
              </a>
              <a 
                href={bookingResult.calendarLinks.outlook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="uptrade-booking-calendar-btn"
              >
                Outlook
              </a>
              <a 
                href={bookingResult.calendarLinks.ics} 
                download
                className="uptrade-booking-calendar-btn"
              >
                Download .ics
              </a>
            </div>
          </div>
          
          <p className="uptrade-booking-email-notice">
            A confirmation email has been sent to your email address.
          </p>
        </div>
      )}

      {/* Default Styles */}
      <style>{`
        .uptrade-booking-widget {
          font-family: var(--booking-font);
          max-width: 480px;
          margin: 0 auto;
          padding: 24px;
          border: 1px solid #e5e5e5;
          border-radius: var(--booking-radius);
          background: #fff;
        }
        
        .uptrade-booking-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px;
          border-radius: var(--booking-radius);
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .uptrade-booking-error button {
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          text-decoration: underline;
        }
        
        .uptrade-booking-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        
        .uptrade-booking-subtitle {
          color: #666;
          margin: 0 0 16px 0;
        }
        
        .uptrade-booking-back {
          background: none;
          border: none;
          color: var(--booking-primary);
          cursor: pointer;
          padding: 0;
          margin-bottom: 16px;
          font-size: 0.875rem;
        }
        
        .uptrade-booking-back:disabled {
          display: none;
        }
        
        .uptrade-booking-type-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .uptrade-booking-type-card {
          text-align: left;
          padding: 16px;
          border: 1px solid #e5e5e5;
          border-radius: var(--booking-radius);
          background: #fff;
          cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        
        .uptrade-booking-type-card:hover {
          border-color: var(--booking-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--booking-primary) 15%, transparent);
        }
        
        .uptrade-booking-type-name {
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .uptrade-booking-type-desc {
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 8px;
        }
        
        .uptrade-booking-type-meta {
          display: flex;
          gap: 12px;
          font-size: 0.75rem;
          color: #888;
        }
        
        .uptrade-booking-date-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 24px;
        }
        
        .uptrade-booking-date {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 12px;
          border: 1px solid #e5e5e5;
          border-radius: var(--booking-radius);
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .uptrade-booking-date:hover {
          border-color: var(--booking-primary);
        }
        
        .uptrade-booking-date.selected {
          background: var(--booking-primary);
          border-color: var(--booking-primary);
          color: #fff;
        }
        
        .uptrade-booking-date-day {
          font-size: 0.625rem;
          text-transform: uppercase;
        }
        
        .uptrade-booking-date-num {
          font-size: 1.125rem;
          font-weight: 600;
        }
        
        .uptrade-booking-time-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        
        .uptrade-booking-time {
          padding: 10px;
          border: 1px solid #e5e5e5;
          border-radius: var(--booking-radius);
          background: #fff;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .uptrade-booking-time:hover:not(:disabled) {
          border-color: var(--booking-primary);
        }
        
        .uptrade-booking-time.selected {
          background: var(--booking-primary);
          border-color: var(--booking-primary);
          color: #fff;
        }
        
        .uptrade-booking-time:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .uptrade-booking-loading,
        .uptrade-booking-empty {
          text-align: center;
          padding: 24px;
          color: #666;
        }
        
        .uptrade-booking-hold-notice {
          background: #fef3c7;
          border: 1px solid #fcd34d;
          color: #92400e;
          padding: 8px 12px;
          border-radius: var(--booking-radius);
          font-size: 0.875rem;
          margin-bottom: 16px;
        }
        
        .uptrade-booking-field {
          margin-bottom: 16px;
        }
        
        .uptrade-booking-field label {
          display: block;
          margin-bottom: 4px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .uptrade-booking-field input,
        .uptrade-booking-field textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e5e5;
          border-radius: var(--booking-radius);
          font-size: 1rem;
          font-family: inherit;
        }
        
        .uptrade-booking-field input:focus,
        .uptrade-booking-field textarea:focus {
          outline: none;
          border-color: var(--booking-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--booking-primary) 15%, transparent);
        }
        
        .uptrade-booking-submit {
          width: 100%;
          padding: 14px;
          background: var(--booking-primary);
          color: #fff;
          border: none;
          border-radius: var(--booking-radius);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .uptrade-booking-submit:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .uptrade-booking-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .uptrade-booking-success {
          text-align: center;
        }
        
        .uptrade-booking-success-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: var(--booking-primary);
          color: #fff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }
        
        .uptrade-booking-confirmation-code {
          font-family: monospace;
          background: #f5f5f5;
          padding: 8px 16px;
          border-radius: var(--booking-radius);
          display: inline-block;
          margin-bottom: 24px;
        }
        
        .uptrade-booking-details {
          text-align: left;
          background: #f9f9f9;
          padding: 16px;
          border-radius: var(--booking-radius);
          margin-bottom: 24px;
        }
        
        .uptrade-booking-details p {
          margin: 0 0 8px 0;
        }
        
        .uptrade-booking-details p:last-child {
          margin-bottom: 0;
        }
        
        .uptrade-booking-calendar-links {
          margin-bottom: 24px;
        }
        
        .uptrade-booking-calendar-buttons {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 8px;
        }
        
        .uptrade-booking-calendar-btn {
          padding: 8px 16px;
          border: 1px solid #e5e5e5;
          border-radius: var(--booking-radius);
          text-decoration: none;
          color: #333;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .uptrade-booking-calendar-btn:hover {
          border-color: var(--booking-primary);
          color: var(--booking-primary);
        }
        
        .uptrade-booking-email-notice {
          color: #666;
          font-size: 0.875rem;
        }
        
        h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 12px 0;
          color: #666;
        }
      `}</style>
    </div>
  )
}

export default BookingWidget
