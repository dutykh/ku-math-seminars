/**
 * Build-time loaders for the YAML week files.
 * Author: Dr. Denys Dutykh (Khalifa University of Science and Technology, Abu Dhabi, UAE)
 *
 * These run only during `astro build` / `astro dev`; nothing here reaches the
 * browser. The YAML lives outside `public/` so the raw files are never served.
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import { weekDataSchema, type WeekData } from './schema';

const DATA_DIR = path.join(process.cwd(), 'data');
const ARCHIVE_DIR = path.join(DATA_DIR, 'archives');

/** Parse and validate one week file, reporting the offending field on failure. */
function parseWeekFile(filePath: string): WeekData {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = yaml.parse(raw);
  const result = weekDataSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Invalid week data in ${path.relative(process.cwd(), filePath)}:\n${issues}`
    );
  }

  return result.data;
}

/** The week currently on display. */
export function loadCurrentWeek(): WeekData {
  return parseWeekFile(path.join(DATA_DIR, 'week.yml'));
}

export interface ArchivedWeek {
  /** Source file stem, e.g. "2025-41-week"; used as a stable anchor id. */
  slug: string;
  year: number;
  data: WeekData;
}

/**
 * Every archived week, newest first. Archive files are named
 * `<year>-<isoWeek>-week.yml`; anything that fails validation is reported
 * rather than silently skipped.
 */
export function loadArchivedWeeks(): ArchivedWeek[] {
  if (!fs.existsSync(ARCHIVE_DIR)) return [];

  return fs
    .readdirSync(ARCHIVE_DIR)
    .filter((name) => name.endsWith('.yml') || name.endsWith('.yaml'))
    .map((name) => {
      const slug = name.replace(/\.ya?ml$/, '');
      const data = parseWeekFile(path.join(ARCHIVE_DIR, name));
      const year = Number.parseInt(slug.slice(0, 4), 10) || new Date(data.week.start).getFullYear();
      return { slug, year, data };
    })
    .sort((a, b) => b.year - a.year || b.data.week.isoWeek - a.data.week.isoWeek);
}
