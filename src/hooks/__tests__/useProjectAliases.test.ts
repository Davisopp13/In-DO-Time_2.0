import { describe, it, expect } from "vitest";
import { buildProjectAliasMap } from "@/hooks/useProjectAliases";

describe("buildProjectAliasMap", () => {
  it("maps lowercased project name to project id", () => {
    const map = buildProjectAliasMap([
      { id: "p1", name: "Web Redesign", aliases: null },
    ]);
    expect(map["web redesign"]).toBe("p1");
  });

  it("maps each alias from project.aliases", () => {
    const map = buildProjectAliasMap([
      { id: "p1", name: "Web Redesign", aliases: ["wr", "website"] },
    ]);
    expect(map["wr"]).toBe("p1");
    expect(map["website"]).toBe("p1");
  });

  it("lowercases aliases", () => {
    const map = buildProjectAliasMap([
      { id: "p1", name: "Web Redesign", aliases: ["WR", "WebSite"] },
    ]);
    expect(map["wr"]).toBe("p1");
    expect(map["website"]).toBe("p1");
  });

  it("generates acronym from multi-word names", () => {
    const map = buildProjectAliasMap([
      { id: "p1", name: "Web Redesign", aliases: null },
    ]);
    expect(map["wr"]).toBe("p1");
  });

  it("does not generate acronym for single-word names", () => {
    const map = buildProjectAliasMap([
      { id: "p1", name: "Backend", aliases: null },
    ]);
    expect(map["b"]).toBeUndefined();
    // Still maps the full name
    expect(map["backend"]).toBe("p1");
  });

  it("does not overwrite explicit alias with auto-generated acronym", () => {
    // "wr" is both an explicit alias of p2 AND the acronym of p1 (Web Redesign)
    // p2's explicit alias should be set first (since p2 comes first in array)
    const map = buildProjectAliasMap([
      { id: "p2", name: "Writing Room", aliases: ["wr"] },
      { id: "p1", name: "Web Redesign", aliases: null },
    ]);
    // "wr" was explicitly set for p2, then p1's acronym check finds it already exists
    expect(map["wr"]).toBe("p2");
    // p1's acronym is also "wr" but should NOT overwrite
    expect(map["web redesign"]).toBe("p1");
  });

  it("handles multiple projects", () => {
    const map = buildProjectAliasMap([
      { id: "p1", name: "Web Redesign", aliases: ["wr"] },
      { id: "p2", name: "Client Tools", aliases: ["ct"] },
      { id: "p3", name: "Backend", aliases: null },
    ]);
    expect(map["web redesign"]).toBe("p1");
    expect(map["wr"]).toBe("p1");
    expect(map["client tools"]).toBe("p2");
    expect(map["ct"]).toBe("p2");
    expect(map["backend"]).toBe("p3");
  });

  it("handles empty project list", () => {
    const map = buildProjectAliasMap([]);
    expect(Object.keys(map)).toHaveLength(0);
  });

  it("handles project with empty aliases array", () => {
    const map = buildProjectAliasMap([
      { id: "p1", name: "My Project", aliases: [] },
    ]);
    expect(map["my project"]).toBe("p1");
    expect(map["mp"]).toBe("p1");
  });

  it("generates acronym for 3+ word names", () => {
    const map = buildProjectAliasMap([
      { id: "p1", name: "In DO Time", aliases: null },
    ]);
    expect(map["idt"]).toBe("p1");
  });
});
