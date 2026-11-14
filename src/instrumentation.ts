/** Next.js server startup hook. Node-only imports stay inside a positive runtime guard. */
export async function register(): Promise<void> {
  // Webpack removes this block from the Edge bundle only when the check is positive.
  // An early return leaves the dynamic import in the Edge dependency graph.
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.ENABLE_INTERNAL_SCHEDULER !== '0') {
    const { startInternalScheduler } = await import('./lib/server/jobs');
    startInternalScheduler();
  }
}
