import { getRunningTimers, getTodaysTimeSummary } from "@/actions/time-entries";
import { getActiveProjects } from "@/actions/projects";
import TimerDashboard from "@/components/timers/TimerDashboard";
import ErrorBoundary from "@/components/ErrorBoundary";

export default async function TimersPage() {
  const [runningTimers, summary, projects] = await Promise.all([
    getRunningTimers(),
    getTodaysTimeSummary(),
    getActiveProjects(),
  ]);

  return (
    <ErrorBoundary>
      <TimerDashboard
        initialRunningTimers={runningTimers}
        initialSummary={summary}
        projects={projects}
      />
    </ErrorBoundary>
  );
}
