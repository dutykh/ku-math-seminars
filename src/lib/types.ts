/**
 * Type definitions for the KU Math Seminars YAML schema.
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 *
 * Types are inferred from the zod schemas in `schema.ts`, so the validation
 * rules and the types can never drift apart.
 */
export type {
  WeekStatus,
  SeminarStatus,
  InterviewMode,
  InterviewType,
  WeekInfo,
  SeriesMeta,
  SeminarLinkMap,
  Seminar,
  InterviewLinks,
  JobInterview,
  WeekData
} from './schema';
