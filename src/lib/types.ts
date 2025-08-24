/**
 * Type definitions for KU Math Seminars YAML schema
 * Author: Dr. Deny Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 */

export type WeekStatus = "open" | "holiday" | "break" | "exams" | "cancelled";

export interface WeekInfo {
  isoWeek: number;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  timezone?: string; // IANA timezone, defaults to Asia/Dubai
  status: WeekStatus;
  note?: string; // optional status note
}

export interface SeriesMeta {
  code: string;
  label: string;
  organisedBy?: string;
}

export interface SeminarLinkMap {
  speaker?: string;
  slides?: string;
  zoom?: string;
  video?: string;
}

export interface Seminar {
  series: string;
  speaker: string;
  affiliation?: string;
  title: string;
  start: string; // ISO 8601 timestamp with offset
  end?: string;  // ISO 8601 timestamp with offset
  location: string;
  abstract?: string; // Markdown supported
  links?: SeminarLinkMap;
  tags?: string[];
}

export interface WeekData {
  week: WeekInfo;
  series?: SeriesMeta[];
  seminars: Seminar[];
}