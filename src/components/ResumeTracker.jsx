import { useEffect } from 'react';
import { getAnalytics } from '../utils/analytics';

/**
 * Invisible component — initializes the analytics engine on mount.
 * Place once at the top level of the app.
 */
export default function ResumeTracker() {
  useEffect(() => {
    const engine = getAnalytics();
    return () => engine.destroy();
  }, []);

  return null; // renders nothing
}
