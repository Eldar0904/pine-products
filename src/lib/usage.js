/**
 * Usage / launches for shipped PINE webpages.
 *
 * Today: launches are stored on each solution and edited in the Product Hub.
 * Next: each shipped app can POST usage events; replace `loadRemoteUsage`
 * to pull those counts and overlay them on solutions.
 */

export function getLaunches(solution) {
  const value = Number(solution?.launches);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
}

export function totalLaunches(solutions = []) {
  return solutions.reduce((sum, solution) => sum + getLaunches(solution), 0);
}

/**
 * Optional remote usage feed.
 * Return `{ [solutionId]: number }` when configured, or `null` while unused.
 */
export async function loadRemoteUsage() {
  // Example once configured:
  // const response = await fetch(import.meta.env.VITE_USAGE_FEED_URL);
  // const rows = await response.json();
  // return Object.fromEntries(rows.map((row) => [row.solution_id, row.launches]));
  return null;
}

export function applyRemoteUsage(solutions, usageBySolutionId) {
  if (!usageBySolutionId) return solutions;
  return solutions.map((solution) => {
    const remote = usageBySolutionId[solution.id];
    if (remote == null) return solution;
    return {
      ...solution,
      launches: Number(remote) || 0,
      usageSource: 'tracked',
    };
  });
}
