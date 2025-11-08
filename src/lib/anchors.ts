/**
 * Anchor/id helpers shared across components.
 */
import type { JobInterview, Seminar } from './types';

/**
 * Generate a stable anchor id for a seminar card.
 * Combines the series code with the seminar timestamp (when available) to ensure uniqueness.
 */
export function getSeminarAnchorId(seriesCode: string, seminar: Seminar): string {
  const timestamp = Date.parse(seminar.start);
  const base = timestamp && !Number.isNaN(timestamp)
    ? `${seriesCode}-${timestamp}`
    : `${seriesCode}-${seminar.speaker}-${seminar.title}`;

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getInterviewAnchorId(interview: JobInterview): string {
  const timestamp = Date.parse(interview.start);
  const base = timestamp && !Number.isNaN(timestamp)
    ? `interview-${timestamp}-${interview.candidate}`
    : `interview-${interview.candidate}-${interview.position}`;

  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
