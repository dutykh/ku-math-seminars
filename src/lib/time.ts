/**
 * Time formatting utilities for KU Math Seminars
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 */

/**
 * Format a week range with ISO week number
 * @param start Start date in YYYY-MM-DD format
 * @param end End date in YYYY-MM-DD format
 * @param isoWeek ISO week number
 * @param timezone IANA timezone identifier
 * @returns Formatted week range string
 */
export function formatWeekRange(
  start: string,
  end: string,
  isoWeek: number,
  timezone: string = 'Asia/Dubai'
): string {
  const startDate = new Date(start + 'T00:00:00');
  const endDate = new Date(end + 'T00:00:00');
  
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  };
  
  const startStr = startDate.toLocaleDateString('en-GB', { 
    day: '2-digit', 
    month: 'short'
  });
  
  const endStr = endDate.toLocaleDateString('en-GB', options);
  
  // Get timezone abbreviation
  const tzAbbr = getTimezoneAbbreviation(timezone);
  
  return `Week ${isoWeek}, ${startStr}–${endStr} (${tzAbbr})`;
}

/**
 * Format a datetime with timezone
 * @param dateStr ISO 8601 date string
 * @param timezone IANA timezone identifier
 * @returns Formatted time string
 */
export function formatTime(dateStr: string, timezone: string = 'Asia/Dubai'): string {
  const date = new Date(dateStr);
  
  return date.toLocaleString('en-GB', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format a time range with timezone
 * @param startStr Start time ISO 8601 string
 * @param endStr End time ISO 8601 string (optional)
 * @param timezone IANA timezone identifier
 * @returns Formatted time range string
 */
export function formatTimeRange(
  startStr: string,
  endStr?: string,
  timezone: string = 'Asia/Dubai'
): string {
  const startTime = formatTime(startStr, timezone);
  
  if (endStr) {
    const endDate = new Date(endStr);
    const endTime = endDate.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${startTime} – ${endTime}`;
  }
  
  return startTime;
}

/**
 * Get timezone abbreviation
 * @param timezone IANA timezone identifier
 * @returns Timezone abbreviation (e.g., GST for Asia/Dubai)
 */
function getTimezoneAbbreviation(timezone: string): string {
  // Common timezone abbreviations
  const abbreviations: Record<string, string> = {
    'Asia/Dubai': 'GST',
    'Asia/Abu_Dhabi': 'GST',
    'UTC': 'UTC',
    'Europe/London': 'GMT/BST',
    'America/New_York': 'EST/EDT',
    'America/Los_Angeles': 'PST/PDT',
    'Europe/Paris': 'CET/CEST',
    'Asia/Tokyo': 'JST',
    'Australia/Sydney': 'AEDT/AEST'
  };
  
  return abbreviations[timezone] || timezone;
}

/**
 * Check if a date is today
 * @param dateStr Date string in any format
 * @param timezone IANA timezone identifier
 * @returns True if the date is today in the given timezone
 */
export function isToday(dateStr: string, timezone: string = 'Asia/Dubai'): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  
  // Convert both to the target timezone for comparison
  const dateInTz = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const todayInTz = new Date(today.toLocaleString('en-US', { timeZone: timezone }));
  
  return dateInTz.toDateString() === todayInTz.toDateString();
}

/**
 * Check if a date is in the current week
 * @param dateStr Date string in any format
 * @param weekStart Start date of the week in YYYY-MM-DD format
 * @param weekEnd End date of the week in YYYY-MM-DD format
 * @returns True if the date is within the week range
 */
export function isInWeek(dateStr: string, weekStart: string, weekEnd: string): boolean {
  const date = new Date(dateStr);
  const start = new Date(weekStart + 'T00:00:00');
  const end = new Date(weekEnd + 'T23:59:59');
  
  return date >= start && date <= end;
}

/**
 * Get the relative position of a time within a day (0-1)
 * Used for timeline positioning of seminars
 * @param dateStr ISO 8601 date string
 * @param timezone IANA timezone identifier
 * @returns Number between 0 and 1 representing position in the day
 */
export function getTimePosition(dateStr: string, timezone: string = 'Asia/Dubai'): number {
  const date = new Date(dateStr);
  
  // Get the time in the specified timezone
  const timeInTz = date.toLocaleString('en-US', { 
    timeZone: timezone,
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Parse hours and minutes
  const [hours, minutes] = timeInTz.split(':').map(Number);
  
  // Calculate position as fraction of day
  // Assuming seminars are between 8:00 and 20:00 (12-hour window)
  const startHour = 8;
  const endHour = 20;
  const totalHours = endHour - startHour;
  
  const currentTime = hours + minutes / 60;
  const adjustedTime = Math.max(startHour, Math.min(endHour, currentTime));
  
  return (adjustedTime - startHour) / totalHours;
}