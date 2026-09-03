import test from "node:test";
import assert from "node:assert/strict";
import { getProjectKeywords, matchTasksToProject } from "../lib/projectMatcher";
import { HabiticaTask, ProjectItem } from "../lib/types";

test("getProjectKeywords: uses custom taskPrefixes and canonicalPrefix if provided", () => {
  const project: ProjectItem = {
    id: "prj-hybridge",
    title: "Hybridge Education — Carrera Ing. de Software & Servicio Social",
    status: "in_progress",
    techStack: ["TypeScript"],
    progress: 50,
    canonicalPrefix: "[Hybridge]",
    taskPrefixes: [
      "hybridge",
      "ciberseguridad y hackeo ético",
      "el tablero de ajedrez (seguridad)",
      "sa módulo 4",
    ],
  };

  const { prefixes, canonicalPrefix } = getProjectKeywords(project);

  assert.equal(canonicalPrefix, "[Hybridge]");
  assert.ok(prefixes.includes("hybridge"));
  assert.ok(prefixes.includes("sa módulo 4"));
  assert.ok(prefixes.includes("ciberseguridad y hackeo ético"));
  assert.ok(prefixes.includes("hybridge education")); // Clean title included as fallback
});

test("getProjectKeywords: formats canonicalPrefix with brackets if user omitted them", () => {
  const project: ProjectItem = {
    id: "prj-custom",
    title: "Mi Proyecto Secreto",
    status: "idea",
    techStack: [],
    progress: 0,
    canonicalPrefix: "Secreto",
    taskPrefixes: ["secreto", "alpha"],
  };

  const { prefixes, canonicalPrefix } = getProjectKeywords(project);

  assert.equal(canonicalPrefix, "[Secreto]");
  assert.ok(prefixes.includes("secreto"));
  assert.ok(prefixes.includes("alpha"));
});

test("getProjectKeywords: falls back cleanly when no taskPrefixes or canonicalPrefix set", () => {
  const project: ProjectItem = {
    id: "prj-new",
    title: "Brio OS — Command Center",
    status: "launched",
    techStack: ["Next.js"],
    progress: 100,
  };

  const { prefixes, canonicalPrefix } = getProjectKeywords(project);

  assert.equal(canonicalPrefix, "[Brio OS]");
  assert.deepEqual(prefixes, ["brio os"]);
});

test("matchTasksToProject: matches tasks accurately and calculates metrics", () => {
  const project: ProjectItem = {
    id: "prj-hybridge",
    title: "Hybridge Education",
    status: "in_progress",
    techStack: ["TypeScript"],
    progress: 0,
    canonicalPrefix: "[Hybridge]",
    taskPrefixes: ["hybridge", "sa módulo 4", "ciberseguridad"],
  };

  const mockTasks: HabiticaTask[] = [
    {
      id: "t1",
      text: "[Hybridge] Entregar reporte de servicio social",
      type: "todo",
      completed: true,
    },
    {
      id: "t2",
      text: "Estudiar para examen de SA Módulo 4",
      type: "todo",
      completed: false,
    },
    {
      id: "t3",
      text: "Revisar logs de servidor [ciberseguridad]",
      type: "todo",
      completed: false,
    },
    {
      id: "t4",
      text: "[Strata] Fix invoice bug",
      type: "todo",
      completed: false,
    },
    {
      id: "t5",
      text: "[Hybridge] Tomar agua",
      type: "habit", // Excluded because it's a habit, not a todo
      completed: false,
    },
  ];

  const metrics = matchTasksToProject(project, mockTasks);

  assert.equal(metrics.totalCount, 3);
  assert.equal(metrics.completedCount, 1);
  assert.equal(metrics.pendingCount, 2);
  assert.equal(metrics.progressPercent, 33);
  assert.equal(metrics.canonicalPrefix, "[Hybridge]");
  assert.deepEqual(
    metrics.matchedTasks.map((t) => t.id),
    ["t1", "t2", "t3"]
  );
});
