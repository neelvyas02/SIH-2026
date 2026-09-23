import React from "react";
import { useAuthStore } from "@/store/authStore";
import { LogOut, ShieldCheck, UserCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";

export function UserMenu() {
  const { session, logout } = useAuthStore();
  const navigate = useNavigate();
  const user = session?.user;

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const roleColor = {
    ADMIN: "border-critical/40 text-critical bg-critical/10",
    COMMANDER: "border-high/40 text-high bg-high/10",
    OPERATOR: "border-primary/40 text-primary bg-primary/10",
    INVESTIGATOR: "border-info/40 text-info bg-info/10",
  }[user.role] || "border-border text-muted-foreground";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md hover:bg-accent/40 border border-border/40 transition-colors text-left focus:outline-hidden">
          <div className="w-7 h-7 rounded-full bg-secondary/80 flex items-center justify-center border border-border text-foreground font-mono text-xs font-semibold">
            {user.fullName.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-xs font-medium leading-none text-foreground">{user.fullName}</span>
            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{user.unit}</span>
          </div>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold ${roleColor}`}>
            {user.role}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-card border-border">
        <DropdownMenuLabel className="font-mono text-xs text-muted-foreground uppercase">
          Security Clearance
        </DropdownMenuLabel>
        <div className="px-2 py-1.5 text-xs">
          <p className="font-semibold text-foreground">{user.fullName}</p>
          <p className="text-muted-foreground text-[11px] font-mono">@{user.username} · {user.unit}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => navigate({ to: "/dashboard" })}
          className="cursor-pointer text-xs flex items-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Operations Command</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate({ to: "/investigation" })}
          className="cursor-pointer text-xs flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4 text-primary" />
          <span>Investigation Workspace</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="cursor-pointer text-xs text-critical flex items-center gap-2 hover:bg-critical/10"
        >
          <LogOut className="w-4 h-4" />
          <span>Terminate Session (Logout)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
