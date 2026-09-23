import React, { useState } from "react";
import type { Alert } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Shield } from "lucide-react";
import { users } from "@/data/users";

interface AlertActionDialogProps {
  alert: Alert | null;
  open: boolean;
  onClose: () => void;
  onAssign: (alertId: string, assignee: string) => void;
}

export function AlertActionDialog({
  alert,
  open,
  onClose,
  onAssign,
}: AlertActionDialogProps) {
  const [selectedUser, setSelectedUser] = useState("operator01");

  if (!alert) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign(alert.id, selectedUser);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md bg-card border-border p-6">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="text-base font-display font-bold text-foreground flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <span>Assign Tactical Duty Officer · {alert.id}</span>
          </DialogTitle>
          <p className="text-xs font-mono text-muted-foreground mt-0.5">
            {alert.type} · {alert.cameraId} · {alert.bopId}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-mono font-medium text-foreground uppercase tracking-wider mb-1.5">
              Select Available Officer
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-secondary/50 border border-input text-xs font-mono text-foreground focus:outline-hidden"
            >
              {users
                .filter((u) => u.status === "active")
                .map((u) => (
                  <option key={u.id} value={u.username}>
                    {u.fullName} (@{u.username}) · {u.role} · {u.unit}
                  </option>
                ))}
            </select>
          </div>

          <div className="p-3 rounded bg-secondary/30 border border-border/70 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5 font-bold text-foreground mb-1">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Operational Mandate:</span>
            </div>
            Assigning will dispatch an automated notification to the duty officer terminal and log in sector audit records.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-mono text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-primary text-primary-foreground text-xs font-mono font-semibold hover:bg-primary/90"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
