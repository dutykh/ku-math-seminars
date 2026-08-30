/**
 * iCalendar feed for the current seminar week.
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 * License: GNU General Public License v3.0
 *
 * Emits RFC 5545 VEVENTs so visitors can subscribe from Outlook, Apple
 * Calendar or Google Calendar. Generated at build time as a static file.
 */
import type { APIRoute } from 'astro';
import { loadCurrentWeek } from '../lib/data';
import type { Seminar, SeriesMeta } from '../lib/types';

const SITE = 'https://www.events.denys-dutykh.com';
const DOMAIN = 'events.denys-dutykh.com';

/** RFC 5545 escaping: backslash, semicolon, comma and newline. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Format an instant as a UTC timestamp, e.g. 20260114T080000Z. */
function toUtcStamp(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
}

/**
 * Fold lines at 75 octets as the spec requires; continuation lines start with
 * a single space. Folding on octets (not characters) keeps multi-byte names
 * intact.
 */
function foldLine(line: string): string {
  const bytes = Buffer.from(line, 'utf8');
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  let start = 0;
  let limit = 75;

  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Do not split a multi-byte sequence: back up to a lead byte.
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    chunks.push(bytes.subarray(start, end).toString('utf8'));
    start = end;
    limit = 74; // continuation lines carry a leading space
  }

  return chunks.join('\r\n ');
}

function seminarDescription(seminar: Seminar, seriesLabel: string): string {
  const parts = [seriesLabel];

  if (seminar.affiliation) parts.push(`Speaker: ${seminar.speaker} (${seminar.affiliation})`);
  else parts.push(`Speaker: ${seminar.speaker}`);

  if (seminar.abstract) parts.push('', seminar.abstract.trim());

  const meeting = seminar.links?.teams || seminar.links?.zoom;
  if (meeting) parts.push('', `Join online: ${meeting}`);
  if (seminar.links?.speaker) parts.push(`Speaker page: ${seminar.links.speaker}`);

  parts.push('', `Full programme: ${SITE}/`);

  return parts.join('\n');
}

export const GET: APIRoute = () => {
  const weekData = loadCurrentWeek();
  const { week } = weekData;
  const seriesByCode = new Map<string, SeriesMeta>(weekData.series.map((s) => [s.code, s]));

  // A fixed DTSTAMP keeps rebuilds byte-identical when the data has not changed.
  const dtstamp = toUtcStamp(new Date(`${week.start} 00:00:00Z`));

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Khalifa University//Mathematics Seminars//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText('KU Mathematics Seminars')}`,
    `X-WR-CALDESC:${escapeText(`Weekly seminar schedule, Mathematics Department, Khalifa University (Week ${week.isoWeek})`)}`,
    `X-WR-TIMEZONE:${week.timezone}`
  ];

  for (const seminar of weekData.seminars) {
    if (seminar.status === 'cancelled') continue;

    const seriesLabel = seriesByCode.get(seminar.series)?.label ?? seminar.series.toUpperCase();
    const start = new Date(seminar.start);
    // Seminars without an explicit end default to one hour.
    const end = seminar.end ? new Date(seminar.end) : new Date(start.getTime() + 60 * 60 * 1000);
    const uid = `seminar-${start.getTime()}-${seminar.series}@${DOMAIN}`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toUtcStamp(start)}`,
      `DTEND:${toUtcStamp(end)}`,
      `SUMMARY:${escapeText(`${seminar.speaker}: ${seminar.title}`)}`,
      `DESCRIPTION:${escapeText(seminarDescription(seminar, seriesLabel))}`,
      `LOCATION:${escapeText(seminar.location)}`,
      `CATEGORIES:${escapeText(seriesLabel)}`,
      `URL:${SITE}/`,
      `STATUS:${seminar.status === 'tentative' ? 'TENTATIVE' : 'CONFIRMED'}`,
      'END:VEVENT'
    );
  }

  for (const interview of weekData.interviews) {
    const start = new Date(interview.start);
    const typeLabel = interview.interviewType === 'teaching' ? 'Teaching' : 'Research';

    lines.push(
      'BEGIN:VEVENT',
      `UID:interview-${start.getTime()}@${DOMAIN}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${toUtcStamp(start)}`,
      `DTEND:${toUtcStamp(interview.end)}`,
      `SUMMARY:${escapeText(`${typeLabel} interview: ${interview.candidate} (${interview.position})`)}`,
      `DESCRIPTION:${escapeText(
        [
          `Faculty ${interview.interviewType} interview for the ${interview.position} position.`,
          interview.notes?.trim(),
          interview.links?.meeting ? `Join online: ${interview.links.meeting}` : '',
          '',
          `Full programme: ${SITE}/`
        ]
          .filter(Boolean)
          .join('\n')
      )}`,
      `LOCATION:${escapeText(interview.location)}`,
      'CATEGORIES:Faculty Job Interview',
      `URL:${SITE}/`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');

  return new Response(lines.map(foldLine).join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="ku-math-seminars.ics"'
    }
  });
};
