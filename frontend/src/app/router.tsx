import type { LucideIcon } from "lucide-react";
import type { ReactElement } from "react";
import { Boxes, Clock3, Database, Home, Settings, SquareStack } from "lucide-react";
import { DataPage } from "../pages/DataPage";
import { HomePage } from "../pages/HomePage";
import { ModelsPage } from "../pages/ModelsPage";
import { ProjectsPage } from "../pages/ProjectsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { TasksPage } from "../pages/TasksPage";

export type RouteKey = "home" | "projects" | "tasks" | "data" | "models" | "settings";

export interface AppRoute {
  key: RouteKey;
  label: string;
  path: string;
  icon: LucideIcon;
  Page: () => ReactElement;
}

export const routes: AppRoute[] = [
  { key: "home", label: "首页", path: "/", icon: Home, Page: HomePage },
  { key: "projects", label: "项目", path: "/projects", icon: SquareStack, Page: ProjectsPage },
  { key: "tasks", label: "任务", path: "/tasks", icon: Clock3, Page: TasksPage },
  { key: "data", label: "数据", path: "/data", icon: Database, Page: DataPage },
  { key: "models", label: "模型", path: "/models", icon: Boxes, Page: ModelsPage },
  { key: "settings", label: "设置", path: "/settings", icon: Settings, Page: SettingsPage },
];

export function getRouteFromPath(pathname: string): AppRoute {
  return routes.find((route) => route.path === pathname) ?? routes[0];
}
