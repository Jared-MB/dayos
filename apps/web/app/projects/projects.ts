/**
 * The demo's projects, three levels deep: the list, a project, and one task
 * inside that project. They live in one place for the same reason the documents
 * do — the list pages render the links, the dynamic routes validate their params
 * against them, and the shell reads the names for the title bars.
 *
 * Every level below the first declares a static route beside the dynamic one,
 * because that pair is what says which window the desktop picks:
 *
 * - `/projects/archive` beside `/projects/:project`
 * - `/projects/:project/new` beside `/projects/:project/:task`
 *
 * The second pair is the one `/documents` can't show. `/projects/:project/new`
 * is static where it competes and still a pattern overall, so it stands for a
 * window per project rather than a single one.
 */
export const PROJECTS = [
  {
    slug: "atlas",
    name: "Atlas",
    summary: "Mapping the desktop's window geometry.",
    tasks: [
      {
        slug: "survey",
        name: "Survey",
        note: "Measure what a window costs to drag when twenty are open.",
      },
      {
        slug: "chart",
        name: "Chart",
        note: "Draw the results somewhere the team will actually look.",
      },
    ],
  },
  {
    slug: "harbor",
    name: "Harbor",
    summary: "Where windows go when the URL changes under them.",
    tasks: [
      {
        slug: "dock",
        name: "Dock",
        note: "Park a window without losing the route it was showing.",
      },
      {
        slug: "moor",
        name: "Moor",
        note: "Keep it there while another window takes the URL.",
      },
    ],
  },
] as const;

/** Retired projects, so `/projects/archive` has something of its own to show. */
export const ARCHIVED = [
  { name: "Beacon", retired: "2025" },
  { name: "Cove", retired: "2024" },
] as const;

export const projectHref = (project: string) => `/projects/${project}`;

export const taskHref = (project: string, task: string) =>
  `/projects/${project}/${task}`;

export const newTaskHref = (project: string) => `/projects/${project}/new`;

export const findProject = (project: string | undefined) =>
  PROJECTS.find((candidate) => candidate.slug === project);

export const findTask = (
  project: string | undefined,
  task: string | undefined,
) => findProject(project)?.tasks.find((candidate) => candidate.slug === task);
