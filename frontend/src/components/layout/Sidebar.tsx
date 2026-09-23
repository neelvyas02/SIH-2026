import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";
import {
  LayoutDashboard,
  Video,
  Camera,
  Users,
  Car,
  ScanFace,
  ScanLine,
  Bell,
  Footprints,
  GitBranch,
  ShieldAlert,
  Flame,
  MapPin,
  Search,
  FolderArchive,
  Fence,
  Activity,
  BarChart3,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
  badge?: string | number;
  roles?: ("ADMIN" | "COMMANDER" | "OPERATOR" | "INVESTIGATOR")[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar() {
  const { session } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const userRole = session?.user?.role ?? "OPERATOR";
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const sections: NavSection[] = [
    {
      title: "Tactical Command",
      items: [
        { label: "Command Center", to: "/dashboard", icon: LayoutDashboard },
        { label: "Live Surveillance", to: "/surveillance", icon: Video },
        { label: "Priority Cameras", to: "/surveillance/priority", icon: Camera },
        { label: "Tactical Border Map", to: "/map", icon: MapPin },
      ],
    },
    {
      title: "AI Detection Engine",
      items: [
        { label: "Human Detection", to: "/detections/human", icon: Users },
        { label: "Vehicle Detection", to: "/detections/vehicle", icon: Car },
        {
          label: "Face Verification",
          to: "/detections/face",
          icon: ScanFace,
          roles: ["ADMIN", "COMMANDER", "INVESTIGATOR"],
        },
        { label: "ANPR Plate Reader", to: "/detections/anpr", icon: ScanLine },
      ],
    },
    {
      title: "Alerts & Tracking",
      items: [
        { label: "Security Alerts", to: "/alerts", icon: Bell, badge: "3 NEW" },
        { label: "Person Tracking", to: "/tracking/person", icon: Footprints },
        { label: "Vehicle Tracking", to: "/tracking/vehicle", icon: Car },
        { label: "Cross-Camera Journey", to: "/journey", icon: GitBranch },
      ],
    },
    {
      title: "Analysis & Intelligence",
      items: [
        { label: "Incidents & Narrative", to: "/incidents", icon: ShieldAlert },
        { label: "Explainable Risk", to: "/risk", icon: Flame },
        {
          label: "AI Investigation",
          to: "/investigation",
          icon: Search,
          roles: ["ADMIN", "COMMANDER", "INVESTIGATOR"],
        },
        {
          label: "Evidence Vault",
          to: "/evidence",
          icon: FolderArchive,
          roles: ["ADMIN", "COMMANDER", "INVESTIGATOR"],
        },
      ],
    },
    {
      title: "Operations & Admin",
      items: [
        { label: "Virtual Fences", to: "/fences", icon: Fence },
        { label: "Camera Telemetry", to: "/camera-health", icon: Activity },
        { label: "Analytics & Trends", to: "/analytics", icon: BarChart3 },
        { label: "Shift Reports", to: "/reports", icon: FileText },
        {
          label: "User Management",
          to: "/admin/users",
          icon: Users,
          roles: ["ADMIN"],
        },
        {
          label: "Camera Streams",
          to: "/admin/cameras",
          icon: Video,
          roles: ["ADMIN"],
        },
        {
          label: "Border Zones",
          to: "/admin/zones",
          icon: Layers,
          roles: ["ADMIN"],
        },
        {
          label: "Audit Logs",
          to: "/admin/audit-logs",
          icon: Settings,
          roles: ["ADMIN"],
        },
      ],
    },
  ];

  return (
    <aside
      className={cn(
        "h-[calc(100vh-3.5rem)] border-r border-border bg-card/90 backdrop-blur-xs flex flex-col justify-between transition-all duration-200 sticky top-14 z-20 select-none",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Scrollable Navigation Items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((section) => {
          // Filter items by role
          const visibleItems = section.items.filter(
            (item) => !item.roles || item.roles.includes(userRole)
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 font-bold">
                  {section.title}
                </div>
              )}
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.to === "/dashboard"
                    ? currentPath === "/dashboard" || currentPath === "/"
                    : currentPath.startsWith(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-colors group relative",
                      isActive
                        ? "bg-primary/15 text-primary border border-primary/30 font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground border border-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 shrink-0 transition-colors",
                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 tracking-tight">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-critical/20 text-critical border border-critical/40">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Collapse / Expand Control Bar */}
      <div className="p-2 border-t border-border/60 bg-muted/20 flex items-center justify-between">
        {!sidebarCollapsed && (
          <div className="flex items-center gap-1.5 px-2 text-[10px] font-mono text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>ROLE: {userRole}</span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          className={cn(
            "p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
            sidebarCollapsed && "mx-auto"
          )}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
