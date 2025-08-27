/**
 * Time formatting utilities for KU Math Seminars
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 */

/**
 * Parse a readable date string to Date object
 * @param dateStr Date string in "Month DD, YYYY" format (e.g., "August 18, 2025")
 * @returns Date object
 */
function parseReadableDate(dateStr: string): Date {
  // Handle both new readable format and legacy ISO format for backward compatibility
  if (dateStr.includes(',')) {
    // New format: "August 18, 2025"
    // Parse components for consistent behavior
    const [monthDay, year] = dateStr.split(', ');
    const [month, day] = monthDay.split(' ');
    // Use ISO format for consistent parsing
    const monthMap: Record<string, string> = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    const monthNum = monthMap[month];
    if (!monthNum) {
      throw new Error(`Invalid month in date string: ${dateStr}`);
    }
    const paddedDay = day.padStart(2, '0');
    return new Date(`${year}-${monthNum}-${paddedDay}T00:00:00`);
  } else {
    // Legacy format: "2025-08-18"
    return new Date(dateStr + 'T00:00:00');
  }
}

/**
 * Format a week range with ISO week number
 * @param start Start date in "Month DD, YYYY" format
 * @param end End date in "Month DD, YYYY" format
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
  const startDate = parseReadableDate(start);
  const endDate = parseReadableDate(end);
  
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
  
  return `Week ${isoWeek}: ${startStr} – ${endStr} (${tzAbbr})`;
}

/**
 * Format a datetime with timezone
 * @param dateStr ISO 8601 date string
 * @param timezone IANA timezone identifier
 * @returns Formatted time string
 */
export function formatTime(dateStr: string, timezone: string = 'Asia/Dubai'): string {
  const date = new Date(dateStr);

  // Build weekday and time separately to avoid locale-inserted comma
  const weekday = date.toLocaleDateString('en-GB', {
    timeZone: timezone,
    weekday: 'long'
  });
  const time = date.toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit'
  });
  return `${weekday} ${time}`;
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
  const startDate = new Date(startStr);

  // Date part: "September 4"
  const datePart = startDate.toLocaleDateString('en-US', {
    timeZone: timezone,
    month: 'long',
    day: 'numeric'
  });
  // Weekday part: "Thursday"
  const weekdayPart = startDate.toLocaleDateString('en-GB', {
    timeZone: timezone,
    weekday: 'long'
  });
  // Time(s)
  const startTime = startDate.toLocaleTimeString('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit'
  });

  if (endStr) {
    const endDate = new Date(endStr);
    const endTime = endDate.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${datePart}, ${weekdayPart}, ${startTime} – ${endTime}`;
  }

  return `${datePart}, ${weekdayPart}, ${startTime}`;
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
 * @param weekStart Start date of the week in "Month DD, YYYY" format
 * @param weekEnd End date of the week in "Month DD, YYYY" format
 * @returns True if the date is within the week range
 */
export function isInWeek(dateStr: string, weekStart: string, weekEnd: string): boolean {
  const date = new Date(dateStr);
  const start = parseReadableDate(weekStart);
  const end = parseReadableDate(weekEnd);
  
  // Set end to end of day
  end.setHours(23, 59, 59, 999);
  
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