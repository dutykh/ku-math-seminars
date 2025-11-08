/**
 * Type definitions for KU Math Seminars YAML schema
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 */

export type WeekStatus = "open" | "holiday" | "break" | "exams" | "cancelled";

export type SeminarStatus = "confirmed" | "cancelled" | "postponed" | "tentative";

export type InterviewMode = "virtual" | "in-person";
export type InterviewType = "teaching" | "research";

export interface WeekInfo {
  isoWeek: number;
  start: string; // Month DD, YYYY (e.g., "August 18, 2025")
  end: string;   // Month DD, YYYY (e.g., "August 24, 2025")
  timezone?: string; // IANA timezone, defaults to Asia/Dubai
  status: WeekStatus;
  note?: string; // optional status note
}

export interface SeriesMeta {
  code: string;
  label: string;
  organisedBy?: string;
  organisedByUrl?: string;
}

export interface SeminarLinkMap {
  speaker?: string;
  slides?: string;
  teams?: string; // Preferred field for online meeting (Microsoft Teams)
  zoom?: string;
  video?: string;
}

export interface Seminar {
  series: string;
  speaker: string;
  affiliation?: string;
  affiliationUrl?: string; // Optional URL for the speaker's university/organization
  title: string;
  start: string; // ISO 8601 timestamp with offset
  end?: string;  // ISO 8601 timestamp with offset
  location: string;
  abstract?: string; // Markdown supported
  biography?: string; // Speaker biography (Markdown supported)
  links?: SeminarLinkMap;
  tags?: string[];
  status?: SeminarStatus; // Optional, defaults to "confirmed"
}

export interface InterviewLinks {
  profile?: string;
  meeting?: string;
  cv?: string;
  recording?: string;
}

export interface JobInterview {
  candidate: string;
  candidateUrl?: string;
  position: string;
  start: string; // ISO 8601 timestamp with offset
  end: string; // ISO 8601 timestamp with offset
  location: string;
  mode: InterviewMode;
  interviewType: InterviewType;
  organizedBy?: string[];
  notes?: string;
  links?: InterviewLinks;
}

export interface WeekData {
  week: WeekInfo;
  series?: SeriesMeta[];
  seminars: Seminar[];
  interviews?: JobInterview[];
}
