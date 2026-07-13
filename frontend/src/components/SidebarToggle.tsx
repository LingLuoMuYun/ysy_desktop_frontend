import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useAssistantPanel } from "../layouts/AssistantPanelContext";

interface SidebarToggleProps {
  className?: string;
}

export function SidebarToggle({ className = "" }: SidebarToggleProps) {
  const { sidebarCollapsed, toggleSidebar } = useAssistantPanel();

  return (
    <button
      className={`settings-menu-toggle${sidebarCollapsed ? " settings-menu-toggle--collapsed" : ""}${className ? ` ${className}` : ""}`}
      onClick={toggleSidebar}
      type="button"
      title={sidebarCollapsed ? "展开主菜单" : "收起主菜单"}
    >
      {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
    </button>
  );
}
