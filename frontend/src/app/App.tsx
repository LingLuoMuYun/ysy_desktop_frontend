import { useMemo, useState } from "react";
import { getRouteFromPath, routes, type RouteKey } from "./router";
import { AppShell } from "../layouts/AppShell";

export function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const activeRoute = useMemo(() => getRouteFromPath(pathname), [pathname]);
  const Page = activeRoute.Page;

  function handleRouteChange(routeKey: RouteKey) {
    const nextRoute = routes.find((route) => route.key === routeKey) ?? routes[0];
    window.history.pushState(null, "", nextRoute.path);
    setPathname(nextRoute.path);
  }

  return (
    <AppShell activeRoute={activeRoute.key} onRouteChange={handleRouteChange}>
      <Page />
    </AppShell>
  );
}
