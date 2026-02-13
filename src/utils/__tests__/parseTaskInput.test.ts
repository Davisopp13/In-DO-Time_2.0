import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseTaskInput } from "../parseTaskInput";

// Helper: get a date N days from today (midnight)
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

// Helper: get the next occurrence of a weekday (0=Sun..6=Sat)
function nextWeekday(target: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const current = d.getDay();
  let diff = target - current;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d;
}

// Helper: today at midnight
function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

describe("parseTaskInput", () => {
  // ─── Plain task (no modifiers) ───────────────────────────────
  describe("plain task", () => {
    it("returns the title as-is with no modifiers", () => {
      const result = parseTaskInput("Buy groceries");
      expect(result.title).toBe("Buy groceries");
      expect(result.due_date).toBeNull();
      expect(result.priority).toBeNull();
      expect(result.project).toBeNull();
      expect(result.tags).toEqual([]);
      expect(result.assignee).toBeNull();
    });

    it("trims whitespace from title", () => {
      const result = parseTaskInput("  Hello world  ");
      expect(result.title).toBe("Hello world");
    });
  });

  // ─── All features combined ───────────────────────────────────
  describe("all features combined", () => {
    it("parses project, date, priority, tag, and assignee together", () => {
      const result = parseTaskInput(
        "Fix bug @backend tomorrow !! #urgent +davis"
      );
      expect(result.title).toBe("Fix bug");
      expect(result.project).toBe("backend");
      expect(result.due_date).toEqual(daysFromNow(1));
      expect(result.priority).toBe("high");
      expect(result.tags).toEqual(["urgent"]);
      expect(result.assignee).toBe("davis");
    });

    it("handles multiple tags with other modifiers", () => {
      const result = parseTaskInput("Design review #ui #ux");
      expect(result.title).toBe("Design review");
      expect(result.tags).toEqual(["ui", "ux"]);
    });
  });

  // ─── Project parsing ─────────────────────────────────────────
  describe("project", () => {
    it("parses @project syntax", () => {
      const result = parseTaskInput("Fix login @frontend");
      expect(result.project).toBe("frontend");
      expect(result.title).toBe("Fix login");
    });

    it("parses /tasks@project syntax", () => {
      const result = parseTaskInput("Deploy /tasks@backend");
      expect(result.project).toBe("backend");
      expect(result.title).toBe("Deploy");
    });

    it("resolves project aliases from context", () => {
      const result = parseTaskInput("Fix tests @wr", {
        projectAliases: { wr: "web-redesign-id", ct: "client-tools-id" },
      });
      expect(result.project).toBe("web-redesign-id");
      expect(result.title).toBe("Fix tests");
    });

    it("uses raw name when alias not found", () => {
      const result = parseTaskInput("Task @unknown", {
        projectAliases: { wr: "web-redesign-id" },
      });
      expect(result.project).toBe("unknown");
    });

    it("is case-insensitive for alias lookup", () => {
      const result = parseTaskInput("Task @WR", {
        projectAliases: { wr: "web-redesign-id" },
      });
      expect(result.project).toBe("web-redesign-id");
    });
  });

  // ─── Tags ────────────────────────────────────────────────────
  describe("tags", () => {
    it("parses a single tag", () => {
      const result = parseTaskInput("Fix bug #hotfix");
      expect(result.tags).toEqual(["hotfix"]);
      expect(result.title).toBe("Fix bug");
    });

    it("parses multiple tags", () => {
      const result = parseTaskInput("Refactor #ui #performance #cleanup");
      expect(result.tags).toEqual(["ui", "performance", "cleanup"]);
      expect(result.title).toBe("Refactor");
    });

    it("lowercases tags", () => {
      const result = parseTaskInput("Task #UrgentFix");
      expect(result.tags).toEqual(["urgentfix"]);
    });
  });

  // ─── Date variants ──────────────────────────────────────────
  describe("dates", () => {
    it('parses "today"', () => {
      const result = parseTaskInput("Do laundry today");
      expect(result.due_date).toEqual(today());
      expect(result.title).toBe("Do laundry");
    });

    it('parses "tomorrow"', () => {
      const result = parseTaskInput("Meeting tomorrow");
      expect(result.due_date).toEqual(daysFromNow(1));
      expect(result.title).toBe("Meeting");
    });

    it('parses "next week" (next Monday)', () => {
      const result = parseTaskInput("Report next week");
      expect(result.due_date).not.toBeNull();
      // Should be a Monday
      expect(result.due_date!.getDay()).toBe(1);
      // Should be in the future
      expect(result.due_date!.getTime()).toBeGreaterThan(today().getTime());
      expect(result.title).toBe("Report");
    });

    it('parses "in N days"', () => {
      const result = parseTaskInput("Review in 3 days");
      expect(result.due_date).toEqual(daysFromNow(3));
      expect(result.title).toBe("Review");
    });

    it('parses "in 1 day" (singular)', () => {
      const result = parseTaskInput("Call client in 1 day");
      expect(result.due_date).toEqual(daysFromNow(1));
      expect(result.title).toBe("Call client");
    });

    it("parses MM/DD format", () => {
      // Pick a date far enough in the future to not roll to next year
      const result = parseTaskInput("Party 12/25");
      expect(result.due_date).not.toBeNull();
      expect(result.due_date!.getMonth()).toBe(11); // December = 11
      expect(result.due_date!.getDate()).toBe(25);
      expect(result.title).toBe("Party");
    });

    it("parses weekday name (Friday)", () => {
      const result = parseTaskInput("Call client Friday");
      expect(result.due_date).toEqual(nextWeekday(5));
      expect(result.title).toBe("Call client");
    });

    it("parses abbreviated weekday (Mon)", () => {
      const result = parseTaskInput("Standup Mon");
      expect(result.due_date).toEqual(nextWeekday(1));
      expect(result.title).toBe("Standup");
    });

    it("parses abbreviated weekday (Wed)", () => {
      const result = parseTaskInput("Sync Wed");
      expect(result.due_date).toEqual(nextWeekday(3));
      expect(result.title).toBe("Sync");
    });

    it("only uses the first date match", () => {
      const result = parseTaskInput("Task today tomorrow");
      expect(result.due_date).toEqual(today());
      // "tomorrow" remains in title since date is already set
      expect(result.title).toBe("Task");
    });
  });

  // ─── Priority ────────────────────────────────────────────────
  describe("priority", () => {
    it("parses !!! as high", () => {
      const result = parseTaskInput("Fix now !!!");
      expect(result.priority).toBe("high");
      expect(result.title).toBe("Fix now");
    });

    it('parses "urgent" as high', () => {
      const result = parseTaskInput("Server down urgent");
      expect(result.priority).toBe("high");
      expect(result.title).toBe("Server down");
    });

    it('parses "asap" as high', () => {
      const result = parseTaskInput("Deploy asap");
      expect(result.priority).toBe("high");
      expect(result.title).toBe("Deploy");
    });

    it("parses !! as high", () => {
      const result = parseTaskInput("Review PR !!");
      expect(result.priority).toBe("high");
      expect(result.title).toBe("Review PR");
    });

    it('parses "important" as high', () => {
      const result = parseTaskInput("Important meeting prep");
      expect(result.priority).toBe("high");
      expect(result.title).toBe("meeting prep");
    });

    it("parses single ! as medium", () => {
      const result = parseTaskInput("Update docs !");
      expect(result.priority).toBe("medium");
      expect(result.title).toBe("Update docs");
    });

    it('parses "low priority" as low', () => {
      const result = parseTaskInput("Clean up repo low priority");
      expect(result.priority).toBe("low");
      expect(result.title).toBe("Clean up repo");
    });

    it("!! does not also trigger single ! match", () => {
      const result = parseTaskInput("Task !!");
      expect(result.priority).toBe("high");
    });

    it("!!! does not also trigger !! or ! matches", () => {
      const result = parseTaskInput("Task !!!");
      expect(result.priority).toBe("high");
    });
  });

  // ─── Assignee ────────────────────────────────────────────────
  describe("assignee", () => {
    it("parses +username", () => {
      const result = parseTaskInput("Review code +davis");
      expect(result.assignee).toBe("davis");
      expect(result.title).toBe("Review code");
    });

    it("only takes the first assignee", () => {
      const result = parseTaskInput("Task +alice +bob");
      expect(result.assignee).toBe("alice");
    });
  });

  // ─── Edge cases ──────────────────────────────────────────────
  describe("edge cases", () => {
    it("returns empty title for empty string", () => {
      const result = parseTaskInput("");
      expect(result.title).toBe("");
      expect(result.due_date).toBeNull();
      expect(result.priority).toBeNull();
      expect(result.project).toBeNull();
      expect(result.tags).toEqual([]);
      expect(result.assignee).toBeNull();
    });

    it("returns empty title when input is only modifiers", () => {
      const result = parseTaskInput("@backend #tag tomorrow !! +davis");
      expect(result.title).toBe("");
      expect(result.project).toBe("backend");
      expect(result.tags).toEqual(["tag"]);
      expect(result.due_date).toEqual(daysFromNow(1));
      expect(result.priority).toBe("high");
      expect(result.assignee).toBe("davis");
    });

    it("collapses extra spaces after removing modifiers", () => {
      const result = parseTaskInput("Fix   the   bug   @backend   tomorrow");
      expect(result.title).toBe("Fix the bug");
    });

    it("handles modifiers at the start of input", () => {
      const result = parseTaskInput("@project Fix the login");
      expect(result.project).toBe("project");
      expect(result.title).toBe("Fix the login");
    });

    it("handles modifiers in the middle of input", () => {
      const result = parseTaskInput("Fix @project the login");
      expect(result.project).toBe("project");
      expect(result.title).toBe("Fix the login");
    });

    it("handles no context provided for alias lookup", () => {
      const result = parseTaskInput("Task @myproject");
      expect(result.project).toBe("myproject");
    });

    it("handles context with empty aliases", () => {
      const result = parseTaskInput("Task @myproject", {
        projectAliases: {},
      });
      expect(result.project).toBe("myproject");
    });
  });
});
