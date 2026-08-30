/**
 * Enterprise Timezone & 24/7 Scheduling Engine for XSendFlow
 * Handles multi-timezone time conversions, overnight dispatch windows,
 * and 24/7 continuous dispatch modes with mathematical precision.
 */

export interface TimezoneOption {
  value: string;
  label: string;
  iana: string;
  offset: string;
  region: string;
}

export const GLOBAL_TIMEZONES: TimezoneOption[] = [
  { value: 'America/New_York (EST)', label: 'Eastern Time (US & Canada - New York / Toronto)', iana: 'America/New_York', offset: 'UTC-5 / UTC-4', region: 'Americas' },
  { value: 'America/Chicago (CST)', label: 'Central Time (US - Chicago / Dallas / Mexico City)', iana: 'America/Chicago', offset: 'UTC-6 / UTC-5', region: 'Americas' },
  { value: 'America/Denver (MST)', label: 'Mountain Time (US - Denver / Phoenix)', iana: 'America/Denver', offset: 'UTC-7 / UTC-6', region: 'Americas' },
  { value: 'America/Los_Angeles (PST)', label: 'Pacific Time (US & Canada - Los Angeles / SF / Vancouver)', iana: 'America/Los_Angeles', offset: 'UTC-8 / UTC-7', region: 'Americas' },
  { value: 'America/Sao_Paulo (BRT)', label: 'Brasilia Time (Brazil - São Paulo / Rio)', iana: 'America/Sao_Paulo', offset: 'UTC-3', region: 'Americas' },
  { value: 'Europe/London (GMT)', label: 'Greenwich Mean Time / BST (London / Dublin / Lisbon)', iana: 'Europe/London', offset: 'UTC+0 / UTC+1', region: 'Europe' },
  { value: 'Europe/Paris (CET)', label: 'Central European Time (Paris / Berlin / Rome / Madrid / Amsterdam)', iana: 'Europe/Paris', offset: 'UTC+1 / UTC+2', region: 'Europe' },
  { value: 'Europe/Helsinki (EET)', label: 'Eastern European Time (Helsinki / Athens / Bucharest)', iana: 'Europe/Helsinki', offset: 'UTC+2 / UTC+3', region: 'Europe' },
  { value: 'Asia/Dubai (GST)', label: 'Gulf Standard Time (Dubai / Abu Dhabi / Riyadh)', iana: 'Asia/Dubai', offset: 'UTC+4', region: 'Middle East' },
  { value: 'Asia/Kolkata (IST)', label: 'India Standard Time (New Delhi / Mumbai / Bangalore)', iana: 'Asia/Kolkata', offset: 'UTC+5:30', region: 'Asia Pacific' },
  { value: 'Asia/Singapore (SGT)', label: 'Singapore & Hong Kong Standard Time (Singapore / HK / KL)', iana: 'Asia/Singapore', offset: 'UTC+8', region: 'Asia Pacific' },
  { value: 'Asia/Tokyo (JST)', label: 'Japan Standard Time (Tokyo / Osaka / Seoul)', iana: 'Asia/Tokyo', offset: 'UTC+9', region: 'Asia Pacific' },
  { value: 'Australia/Sydney (AEST)', label: 'Australian Eastern Time (Sydney / Melbourne / Brisbane)', iana: 'Australia/Sydney', offset: 'UTC+10 / UTC+11', region: 'Australia' },
  { value: 'Pacific/Auckland (NZST)', label: 'New Zealand Standard Time (Auckland / Wellington)', iana: 'Pacific/Auckland', offset: 'UTC+12 / UTC+13', region: 'Australia' },
  { value: 'UTC', label: 'Coordinated Universal Time (UTC / GMT)', iana: 'UTC', offset: 'UTC+0', region: 'Global' }
];

export interface ScheduleWindowInspection {
  inWindow: boolean;
  is24Hours: boolean;
  currentLocalTime: string; // "14:35"
  currentFormattedTime: string; // "2:35 PM"
  ianaTimezone: string;
  windowStart: string;
  windowEnd: string;
  statusText: string;
  reason: string;
}

/**
 * Extracts clean IANA timezone name from a string like "America/New_York (EST)"
 */
export function extractIanaTimezone(tzString?: string): string {
  if (!tzString || tzString.trim() === '') return 'UTC';
  const clean = tzString.trim();
  const matched = GLOBAL_TIMEZONES.find(t => t.value === clean || t.iana === clean);
  if (matched) return matched.iana;

  // Fallback: extract the first segment before parenthesis or space
  const firstWord = clean.split(/[ (]/)[0].trim();
  return firstWord || 'UTC';
}

/**
 * Detects the user's browser timezone and maps it to the closest supported GLOBAL_TIMEZONES entry.
 */
export function detectUserTimezone(): string {
  try {
    const userIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (userIana) {
      // 1. Direct match on iana
      const exact = GLOBAL_TIMEZONES.find(t => t.iana.toLowerCase() === userIana.toLowerCase());
      if (exact) return exact.value;

      // 2. Partial match on city / country
      const city = userIana.split('/')[1] || userIana;
      const partial = GLOBAL_TIMEZONES.find(t => t.iana.toLowerCase().includes(city.toLowerCase()) || t.value.toLowerCase().includes(city.toLowerCase()));
      if (partial) return partial.value;

      // 3. Match on offset
      const now = new Date();
      const userOffsetMin = -now.getTimezoneOffset();
      const userOffsetHours = userOffsetMin / 60;
      const offsetMatch = GLOBAL_TIMEZONES.find(t => {
        if (t.offset.includes(`${userOffsetHours > 0 ? '+' : ''}${userOffsetHours}`)) return true;
        return false;
      });
      if (offsetMatch) return offsetMatch.value;
    }
  } catch {}
  return 'Asia/Kolkata (IST)';
}

/**
 * Computes dynamic default sending window:
 * - Start time: current target clock + 2 minutes
 * - End time: current target clock + 3 hours
 */
export function getDefaultDynamicWindow(timezoneStr?: string): {
  windowStart: string;
  windowEnd: string;
  detectedTimezone: string;
} {
  const detectedTimezone = timezoneStr || detectUserTimezone();
  const targetTime = getTargetLocalTime(detectedTimezone);

  const startTotalMinutes = (targetTime.hour * 60 + targetTime.minute + 2) % 1440;
  const startHour = Math.floor(startTotalMinutes / 60);
  const startMin = startTotalMinutes % 60;
  const windowStart = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;

  const endTotalMinutes = (targetTime.hour * 60 + targetTime.minute + 180) % 1440;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMin = endTotalMinutes % 60;
  const windowEnd = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;

  return {
    windowStart,
    windowEnd,
    detectedTimezone
  };
}

/**
 * Gets exact current time in the target timezone
 */
export function getTargetLocalTime(timezoneStr?: string, referenceDate: Date = new Date()): {
  hour: number;
  minute: number;
  timeString24: string;
  timeString12: string;
  ianaTz: string;
} {
  const ianaTz = extractIanaTimezone(timezoneStr);

  try {
    const formatter24 = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });

    const formatter12 = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTz,
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    const parts = formatter24.formatToParts(referenceDate);
    const hourPart = parts.find(p => p.type === 'hour')?.value || '0';
    const minutePart = parts.find(p => p.type === 'minute')?.value || '0';

    const hour = Number(hourPart) % 24;
    const minute = Number(minutePart);

    const timeString24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const timeString12 = formatter12.format(referenceDate);

    return {
      hour,
      minute,
      timeString24,
      timeString12,
      ianaTz
    };
  } catch {
    // Fallback to UTC if invalid timezone
    const hour = referenceDate.getUTCHours();
    const minute = referenceDate.getUTCMinutes();
    return {
      hour,
      minute,
      timeString24: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      timeString12: `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
      ianaTz: 'UTC'
    };
  }
}

/**
 * Evaluates whether a campaign is currently permitted to send emails based on its
 * target timezone, sending window, or 24/7 continuous dispatch mode.
 *
 * @param windowStart Start time string "09:00"
 * @param windowEnd End time string "17:00"
 * @param timezoneStr Timezone string "America/New_York (EST)"
 * @param is24Hours Whether 24/7 continuous sending is enabled
 * @param referenceDate Optional test reference Date
 */
export function inspectScheduleWindow(
  windowStart = '09:00',
  windowEnd = '17:00',
  timezoneStr = 'America/New_York (EST)',
  is24Hours = false,
  referenceDate: Date = new Date()
): ScheduleWindowInspection {
  const { hour, minute, timeString24, timeString12, ianaTz } = getTargetLocalTime(timezoneStr, referenceDate);

  // 1. 24/7 Mode overrides all hour restrictions
  if (is24Hours || (windowStart === '00:00' && windowEnd === '23:59')) {
    return {
      inWindow: true,
      is24Hours: true,
      currentLocalTime: timeString24,
      currentFormattedTime: timeString12,
      ianaTimezone: ianaTz,
      windowStart: '00:00',
      windowEnd: '23:59',
      statusText: '🟢 24/7 Continuous Dispatch Active',
      reason: '24/7 continuous sending mode is active. Emails dispatch around the clock.'
    };
  }

  // 2. Parse Window Limits into minutes from midnight
  const [startH = 9, startM = 0] = (windowStart || '09:00').split(':').map(Number);
  const [endH = 17, endM = 0] = (windowEnd || '17:00').split(':').map(Number);

  const currentMinutes = hour * 60 + minute;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  let inWindow = false;

  if (startMinutes <= endMinutes) {
    // Normal single-day window (e.g. 09:00 to 17:00)
    inWindow = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  } else {
    // Overnight cross-midnight window (e.g. 22:00 to 06:00)
    inWindow = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  const tzShort = timezoneStr.split(' ')[1]?.replace(/[()]/g, '') || ianaTz.split('/')[1] || ianaTz;

  if (inWindow) {
    return {
      inWindow: true,
      is24Hours: false,
      currentLocalTime: timeString24,
      currentFormattedTime: timeString12,
      ianaTimezone: ianaTz,
      windowStart,
      windowEnd,
      statusText: `🟢 In Window (${windowStart} - ${windowEnd} ${tzShort})`,
      reason: `Current time in ${ianaTz} is ${timeString12}, which falls inside the active sending window (${windowStart} to ${windowEnd}).`
    };
  } else {
    return {
      inWindow: false,
      is24Hours: false,
      currentLocalTime: timeString24,
      currentFormattedTime: timeString12,
      ianaTimezone: ianaTz,
      windowStart,
      windowEnd,
      statusText: `⏳ Scheduled (Opens at ${windowStart} ${tzShort})`,
      reason: `Current time in ${ianaTz} is ${timeString12}. Outside active window (${windowStart} - ${windowEnd}). Next dispatch triggers when target local clock hits ${windowStart}.`
    };
  }
}
