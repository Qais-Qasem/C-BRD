export interface TaskStartAuditData {
  isoTimestamp: string;
  localDate: string;
  localTime: string;
  utcOffset: string;
  timeZone: string;
  timeZoneAbbr: string;
}

export function generateTaskStartTimestamp(now: Date = new Date()) {
  const isoTimestamp = now.toISOString();

  // Local date: YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const localDate = `${year}-${month}-${day}`;

  // Local time: HH:MM:SS
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const localTime = `${hours}:${minutes}:${seconds}`;

  // IANA timezone name (e.g. America/Detroit)
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    timeZone = 'UTC';
  }

  // UTC Offset (-04:00, +02:00, etc.)
  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absMins = Math.abs(offsetMinutes);
  const offsetHoursStr = String(Math.floor(absMins / 60)).padStart(2, '0');
  const offsetMinsStr = String(absMins % 60).padStart(2, '0');
  const utcOffset = `${sign}${offsetHoursStr}:${offsetMinsStr}`;

  // Timezone Abbreviation (EDT, EST, PDT, PST, BST, GMT, etc.)
  let timeZoneAbbr = '';
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
      timeZone: timeZone !== 'UTC' ? timeZone : undefined,
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    if (tzPart && tzPart.value) {
      timeZoneAbbr = tzPart.value;
    }
  } catch {
    // fallback
  }

  if (!timeZoneAbbr) {
    timeZoneAbbr = `UTC${utcOffset}`;
  }

  const startedAtString = `TASK PERFORMANCE STARTED — ${localDate} — ${localTime} — ${timeZoneAbbr}`;

  const startAuditData: TaskStartAuditData = {
    isoTimestamp,
    localDate,
    localTime,
    utcOffset,
    timeZone,
    timeZoneAbbr,
  };

  return {
    startedAtString,
    startAuditData,
  };
}
