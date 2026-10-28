// This file changes 42 API data into profile data for the app.
export type Skill = { id: number; name: string; level: number };
export type Cursus = { id: number; name: string; level: number; skills: Skill[] };
export type Project = { id: number; name: string; cursusIds: number[]; finalMark: number | null; validated: boolean | null; status: string; updatedAt: string | null };
export type Profile = { login: string; name: string; email: string | null; mobile: string | null; location: string | null; wallet: number | null; evaluationPoints: number | null; imageUrls: string[]; cursus: Cursus[]; projects: Project[] };

// Use empty values when an API field has the wrong type.
const record = (value: unknown): Record<string, unknown> => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const string = (value: unknown): string | null => typeof value === 'string' && value.trim() ? value : null;
const number = (value: unknown): number | null => typeof value === 'number' && Number.isFinite(value) ? value : null;

export function parseProfile(value: unknown): Profile {
  // Check the required fields before the app uses the profile.
  const raw = record(value);
  const login = string(raw.login);
  if (!login || !Array.isArray(raw.cursus_users) || !Array.isArray(raw.projects_users)) throw new Error('The profile data is incomplete.');
  const image = record(raw.image);
  const versions = record(image.versions);
  // Keep only secure photo addresses. Remove repeated addresses.
  const imageUrls = [versions.large, versions.medium, versions.small, versions.micro, image.link, raw.image_url]
    .map(string).filter((url): url is string => !!url && /^https:\/\//i.test(url));
  return {
    login,
    name: string(raw.displayname) || string(raw.usual_full_name) || login,
    email: string(raw.email),
    mobile: string(raw.mobile),
    location: string(raw.location),
    wallet: number(raw.wallet),
    evaluationPoints: number(raw.correction_point),
    imageUrls: [...new Set(imageUrls)],
    cursus: raw.cursus_users.map((item) => {
      const row = record(item); const course = record(row.cursus);
      return { id: number(row.cursus_id) ?? number(course.id) ?? 0, name: string(course.name) || 'Cursus', level: number(row.level) ?? 0,
        skills: Array.isArray(row.skills) ? row.skills.map((skill) => { const s = record(skill); return { id: number(s.id) ?? 0, name: string(s.name) || 'Unknown skill', level: number(s.level) ?? 0 }; }) : [] };
    }),
    projects: raw.projects_users.map((item) => {
      const row = record(item); const project = record(row.project);
      return { id: number(row.id) ?? 0, name: string(project.name) || 'Unnamed project',
        cursusIds: Array.isArray(row.cursus_ids) ? row.cursus_ids.filter((id): id is number => typeof id === 'number') : [],
        finalMark: number(row.final_mark), validated: typeof row['validated?'] === 'boolean' ? row['validated?'] as boolean : null,
        status: string(row.status) || 'unknown', updatedAt: string(row.updated_at) };
    }),
  };
}

export function projectState(project: Project): 'passed' | 'failed' | 'unfinished' {
  // Use the project status and the validation result to select one state.
  if (project.status !== 'finished') return 'unfinished';
  if (project.validated === true) return 'passed';
  if (project.validated === false) return 'failed';
  return 'unfinished';
}

export function skillPercent(level: number): number {
  // Show the decimal part of a level as a value from 0 to 100.
  return Math.max(0, Math.min(100, Math.round((level - Math.floor(level)) * 100)));
}
