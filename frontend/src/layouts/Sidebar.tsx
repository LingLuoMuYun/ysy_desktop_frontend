import { routes, type RouteKey } from "../app/router";

interface SidebarProps {
  activeRoute: RouteKey;
  onRouteChange: (routeKey: RouteKey) => void;
}

export function Sidebar({ activeRoute, onRouteChange }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="主导航">
      <button className="brand-button" type="button" title="桌面智算">
        <span className="brand-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </button>
      <nav className="nav-list">
        {routes.map((route) => {
          const Icon = route.icon;
          const isActive = activeRoute === route.key;
          return (
            <button
              className={`nav-item${isActive ? " nav-item--active" : ""}`}
              key={route.key}
              onClick={() => onRouteChange(route.key)}
              type="button"
            >
              <Icon size={19} />
              <span>{route.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
