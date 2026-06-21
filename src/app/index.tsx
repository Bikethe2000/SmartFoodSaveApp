/**
 * app/index.tsx
 *
 * Root index route - RouteGuard in _layout.tsx handles all redirects.
 * This component just returns null since routing is managed by the root layout.
 */
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    // RouteGuard in _layout.tsx will handle the redirect based on auth state
  }, []);
  
  return null;
}

