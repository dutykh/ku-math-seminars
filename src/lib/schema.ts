/**
 * YAML schema for KU Math Seminars week files.
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 *
 * The week files are hand-edited every week, so they are validated at build
 * time: a mistyped status, a malformed timestamp or a missing required field
 * fails the build instead of shipping a broken page. Types used across the
 * site are inferred from these schemas rather than declared separately.
 */
import { z } from 'astro/zod';

/** ISO 8601 timestamp carrying an explicit offset, e.g. 2026-01-14T12:00:00+04:00 */
const isoTimestamp = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'must be an ISO 8601 timestamp with offset, e.g. 2026-01-14T12:00:00+04:00'
  });

/** An absolute http(s) URL. */
const httpUrl = z
  .string()
  .refine(
    (value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'must be an absolute http(s) URL' }
  );

/** Readable date used for week boundaries, e.g. "January 12, 2026" */
const readableDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'must be a readable date, e.g. "January 12, 2026"'
  });

export const weekStatusSchema = z
  .enum(['open', 'holiday', 'break', 'exams', 'cancelled', 'standby'])
  .default('open');

export const seminarStatusSchema = z
  .enum(['confirmed', 'cancelled', 'postponed', 'tentative'])
  .default('confirmed');

export const weekInfoSchema = z.object({
  isoWeek: z.number().int().min(1).max(53),
  start: readableDate,
  end: readableDate,
  timezone: z.string().default('Asia/Dubai'),
  status: weekStatusSchema,
  semester: z.string().optional(),
  nextSemester: z.string().optional(),
  resumeDate: z.string().optional(),
  note: z.string().optional()
});

export const seriesMetaSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
  organisedBy: z.string().optional(),
  organisedByUrl: httpUrl.optional()
});

export const seminarSchema = z.object({
  series: z.string().min(1),
  speaker: z.string().min(1),
  affiliation: z.string().optional(),
  affiliationUrl: httpUrl.optional(),
  title: z.string().min(1),
  start: isoTimestamp,
  end: isoTimestamp.optional(),
  location: z.string().min(1),
  abstract: z.string().optional(),
  biography: z.string().optional(),
  links: z
    .object({
      speaker: httpUrl.optional(),
      slides: httpUrl.optional(),
      teams: httpUrl.optional(),
      zoom: httpUrl.optional(),
      video: httpUrl.optional()
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  status: seminarStatusSchema
});

export const interviewSchema = z.object({
  candidate: z.string().min(1),
  candidateUrl: httpUrl.optional(),
  position: z.string().min(1),
  start: isoTimestamp,
  end: isoTimestamp,
  location: z.string().min(1),
  mode: z.enum(['virtual', 'in-person']),
  interviewType: z.enum(['teaching', 'research']),
  organizedBy: z.array(z.string()).optional(),
  notes: z.string().optional(),
  links: z
    .object({
      profile: httpUrl.optional(),
      meeting: httpUrl.optional(),
      cv: httpUrl.optional(),
      recording: httpUrl.optional()
    })
    .optional()
});

export const weekDataSchema = z.object({
  week: weekInfoSchema,
  series: z.array(seriesMetaSchema).default([]),
  seminars: z.array(seminarSchema).nullable().default([]).transform((v) => v ?? []),
  interviews: z.array(interviewSchema).nullable().default([]).transform((v) => v ?? [])
});

export type WeekStatus = z.infer<typeof weekStatusSchema>;
export type SeminarStatus = z.infer<typeof seminarStatusSchema>;
export type WeekInfo = z.infer<typeof weekInfoSchema>;
export type SeriesMeta = z.infer<typeof seriesMetaSchema>;
export type Seminar = z.infer<typeof seminarSchema>;
export type JobInterview = z.infer<typeof interviewSchema>;
export type WeekData = z.infer<typeof weekDataSchema>;
export type InterviewMode = JobInterview['mode'];
export type InterviewType = JobInterview['interviewType'];
export type SeminarLinkMap = NonNullable<Seminar['links']>;
export type InterviewLinks = NonNullable<JobInterview['links']>;
