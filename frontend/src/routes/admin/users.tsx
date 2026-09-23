import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { adminService } from "@/services/adminService";
import type { Role, User } from "@/types";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Users, UserPlus, KeyRound, Shield, Search, CheckCircle, Ban } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [userList, setUserList] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const loadUsers = () => {
    adminService.getUsers().then((list) => setUserList(list));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    await adminService.updateUserRole(userId, newRole);
    toast.success(`Role updated for user ${userId} to ${newRole}`);
    loadUsers();
  };

  const handleToggleStatus = async (userId: string) => {
    const updated = await adminService.toggleUserStatus(userId);
    toast.info(`Account status for ${updated.username} changed to ${updated.status.toUpperCase()}`);
    loadUsers();
  };

  const handleResetPassword = (username: string) => {
    toast.success(`Temporary security passphrase issued for @${username}`);
  };

  const filtered = userList.filter((u) => {
    if (filterRole !== "all" && u.role !== filterRole) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.username.toLowerCase().includes(q) ||
        u.fullName.toLowerCase().includes(q) ||
        u.unit.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                User Management &amp; Security Clearances
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-critical/15 text-critical border border-critical/30 uppercase font-semibold">
                ADMIN RESTRICTED
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Sector Security Directory · Operational Clearance Roles · Access Suspension &amp; Passphrases
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3.5 rounded-lg border border-border bg-card flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, name, or unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-md bg-secondary/40 border border-input text-foreground focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-2.5 py-1.5 rounded-md bg-secondary/40 border border-input text-foreground focus:outline-hidden"
            >
              <option value="all">All Clearance Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="COMMANDER">COMMANDER</option>
              <option value="OPERATOR">OPERATOR</option>
              <option value="INVESTIGATOR">INVESTIGATOR</option>
            </select>
          </div>
        </div>

        {/* User Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-secondary/40 border-b border-border text-[11px] text-muted-foreground uppercase">
                <tr>
                  <th className="p-3">User Call-Sign</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Clearance Role</th>
                  <th className="p-3">Sector Unit</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">
                      @{user.username}
                      <span className="text-[10px] text-muted-foreground block font-normal">{user.id}</span>
                    </td>
                    <td className="p-3 font-medium text-foreground">{user.fullName}</td>
                    <td className="p-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as Role)}
                        className="px-2 py-1 rounded bg-secondary/70 border border-input text-foreground text-xs focus:outline-hidden"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="COMMANDER">COMMANDER</option>
                        <option value="OPERATOR">OPERATOR</option>
                        <option value="INVESTIGATOR">INVESTIGATOR</option>
                      </select>
                    </td>
                    <td className="p-3 text-muted-foreground">{user.unit}</td>
                    <td className="p-3">
                      <StatusBadge status={user.status} size="sm" />
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleResetPassword(user.username)}
                        className="px-2 py-1 rounded hover:bg-secondary border border-border text-muted-foreground hover:text-foreground text-[11px]"
                        title="Issue Token Reset"
                      >
                        Reset Passphrase
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`px-2 py-1 rounded border text-[11px] font-semibold ${
                          user.status === "active"
                            ? "bg-critical/15 text-critical border-critical/30 hover:bg-critical/25"
                            : "bg-online/15 text-online border-online/30 hover:bg-online/25"
                        }`}
                      >
                        {user.status === "active" ? "Disable User" : "Activate User"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
