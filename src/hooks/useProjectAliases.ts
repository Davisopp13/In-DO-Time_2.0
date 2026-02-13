"use client";

import { useMemo } from "react";
import type { Project } from "@/types";

/**
 * Builds a Record<string, projectId> alias map from an array of projects.
 *
 * Includes for each project:
 *   - Lowercased project name (e.g., "web redesign" → id)
 *   - Each alias from project.aliases array (e.g., "wr" → id)
 *   - Auto-generated acronym from first letter of each word, lowercased,
 *     only if the acronym is >1 character (e.g., "Web Redesign" → "wr" → id)
 */
export function buildProjectAliasMap(
  projects: Pick<Project, "id" | "name" | "aliases">[]
): Record<string, string> {
  const map: Record<string, string> = {};

  for (const project of projects) {
    const id = project.id;

    // 1. Lowercased full project name
    map[project.name.toLowerCase()] = id;

    // 2. Each alias from project.aliases array
    if (project.aliases) {
      for (const alias of project.aliases) {
        map[alias.toLowerCase()] = id;
      }
    }

    // 3. Auto-generated acronym (first letter of each word, lowercased)
    //    Only include if the acronym is more than 1 character
    const words = project.name.trim().split(/\s+/);
    if (words.length > 1) {
      const acronym = words.map((w) => w[0]).join("").toLowerCase();
      if (acronym.length > 1) {
        // Don't overwrite explicit aliases
        if (!(acronym in map)) {
          map[acronym] = id;
        }
      }
    }
  }

  return map;
}

/**
 * Hook that returns a memoized project alias map for use with parseTaskInput.
 * Pass the projects array from your data source (server props, context, etc.).
 */
export function useProjectAliases(
  projects: Pick<Project, "id" | "name" | "aliases">[]
): Record<string, string> {
  return useMemo(() => buildProjectAliasMap(projects), [projects]);
}
