import appIconUrl from "../assets/app-icon.svg";
import { routes, type RouteKey } from "../app/router";

interface SidebarProps {
  activeRoute: RouteKey;
  onRouteChange: (routeKey: RouteKey) => void;
}

export function Sidebar({ activeRoute, onRouteChange }: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="主导航">
      <button
        className="brand-button"
        type="button"
        title="返回首页"
        aria-label="返回首页"
        onClick={() => onRouteChange("home")}
      >
        <img src={appIconUrl} alt="" />
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
