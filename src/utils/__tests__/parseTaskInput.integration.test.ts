import { describe, it, expect } from "vitest";
import { parseTaskInput } from "@/utils/parseTaskInput";
import { buildProjectAliasMap } from "@/hooks/useProjectAliases";

/**
 * Integration test: buildProjectAliasMap feeds into parseTaskInput's context.
 * Verifies the full flow from project data → alias map → parsed task.
 */
describe("parseTaskInput + buildProjectAliasMap integration", () => {
  const projects = [
    { id: "proj-001", name: "Web Redesign", aliases: ["wr", "website"] },
    { id: "proj-002", name: "Client Tools", aliases: ["ct"] },
    { id: "proj-003", name: "Backend", aliases: null },
    { id: "proj-004", name: "In DO Time", aliases: ["idt", "app"] },
  ];

  const projectAliases = buildProjectAliasMap(projects);

  it("resolves explicit alias to project id", () => {
    const result = parseTaskInput("Fix login bug @wr", { projectAliases });
    expect(result.title).toBe("Fix login bug");
    expect(result.project).toBe("proj-001");
  });

  it("resolves full project name to project id", () => {
    const result = parseTaskInput("Update docs @backend", { projectAliases });
    expect(result.title).toBe("Update docs");
    expect(result.project).toBe("proj-003");
  });

  it("resolves auto-generated acronym to project id", () => {
    // "Web Redesign" generates acronym "wr" but that's already an explicit alias
    // "Client Tools" generates acronym "ct" but that's already an explicit alias
    // "In DO Time" generates acronym "idt" but that's already an explicit alias
    // Test with a project that only has an auto-generated acronym
    const customProjects = [
      { id: "proj-100", name: "Design System", aliases: null },
    ];
    const customAliases = buildProjectAliasMap(customProjects);
    const result = parseTaskInput("Fix colors @ds", {
      projectAliases: customAliases,
    });
    expect(result.title).toBe("Fix colors");
    expect(result.project).toBe("proj-100");
  });

  it("falls back to raw name when alias not found", () => {
    const result = parseTaskInput("Investigate @unknown", { projectAliases });
    expect(result.title).toBe("Investigate");
    expect(result.project).toBe("unknown");
  });

  it("handles the PRD verification example: full feature combo", () => {
    const result = parseTaskInput(
      "Fix bug @wr tomorrow !! #urgent +davis",
      { projectAliases }
    );
    expect(result.title).toBe("Fix bug");
    expect(result.project).toBe("proj-001");
    expect(result.priority).toBe("high");
    expect(result.tags).toEqual(["urgent"]);
    expect(result.assignee).toBe("davis");
    expect(result.due_date).not.toBeNull();
    // Tomorrow should be 1 day from now
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(result.due_date!.getTime()).toBe(tomorrow.getTime());
  });

  it("handles /tasks@alias syntax", () => {
    const result = parseTaskInput("Deploy changes /tasks@ct", {
      projectAliases,
    });
    expect(result.title).toBe("Deploy changes");
    expect(result.project).toBe("proj-002");
  });

  it("handles project alias with multiple other features", () => {
    const result = parseTaskInput(
      "Design review @app #ui #ux Friday low priority +sarah",
      { projectAliases }
    );
    expect(result.title).toBe("Design review");
    expect(result.project).toBe("proj-004");
    expect(result.tags).toEqual(["ui", "ux"]);
    expect(result.priority).toBe("low");
    expect(result.assignee).toBe("sarah");
    expect(result.due_date).not.toBeNull();
  });

  it("works with empty project list", () => {
    const emptyAliases = buildProjectAliasMap([]);
    const result = parseTaskInput("Fix bug @backend", {
      projectAliases: emptyAliases,
    });
    // No alias match → falls back to raw name
    expect(result.project).toBe("backend");
  });

  it("case-insensitive alias lookup", () => {
    const result = parseTaskInput("Fix styles @WR", { projectAliases });
    expect(result.project).toBe("proj-001");
  });

  it("case-insensitive alias lookup via project name", () => {
    const result = parseTaskInput("Fix API @Backend", { projectAliases });
    expect(result.project).toBe("proj-003");
  });
});
