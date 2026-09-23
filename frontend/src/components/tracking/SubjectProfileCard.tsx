import React from "react";
import type { Person, Vehicle } from "@/types";
import { User, Car, ShieldAlert, Clock, Camera, ArrowRight } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface SubjectProfileCardProps {
  subject: Person | Vehicle;
  type: "person" | "vehicle";
  onInspectCamera?: (cameraId: string) => void;
}

export function SubjectProfileCard({
  subject,
  type,
  onInspectCamera,
}: SubjectProfileCardProps) {
  const navigate = useNavigate();
  const isPerson = type === "person";
  const person = isPerson ? (subject as Person) : null;
  const vehicle = !isPerson ? (subject as Vehicle) : null;

  return (
    <div className="p-4 rounded-lg border border-border bg-card flex flex-col justify-between hover:border-primary/50 transition-all shadow-xs">
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-secondary/80 border border-border text-primary shrink-0">
              {isPerson ? <User className="w-4 h-4" /> : <Car className="w-4 h-4" />}
            </div>
            <div>
              <span className="font-mono text-sm font-bold text-foreground">
                {subject.id}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground block">
                {isPerson ? person?.label : `Plate: ${vehicle?.plate}`}
              </span>
            </div>
          </div>

          {isPerson && person?.watchlist && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-critical/20 text-critical border border-critical/30 uppercase">
              WATCHLIST
            </span>
          )}

          {!isPerson && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 uppercase">
              {vehicle?.vehicleClass}
            </span>
          )}
        </div>

        {/* First & Last Seen Blocks */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
          <div className="p-2 rounded bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">FIRST SEEN:</span>
            <button
              onClick={() => onInspectCamera?.(subject.firstSeen.cameraId)}
              className="text-primary hover:underline font-bold block mt-0.5"
            >
              {subject.firstSeen.cameraId}
            </button>
            <span className="text-[10px] text-muted-foreground">
              {subject.firstSeen.timestamp.split("T")[1]?.slice(0, 8)} IST
            </span>
          </div>

          <div className="p-2 rounded bg-secondary/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">CURRENT SENSOR:</span>
            <button
              onClick={() => onInspectCamera?.(subject.lastSeen.cameraId)}
              className="text-high hover:underline font-bold block mt-0.5"
            >
              {subject.lastSeen.cameraId}
            </button>
            <span className="text-[10px] text-muted-foreground">
              {subject.lastSeen.timestamp.split("T")[1]?.slice(0, 8)} IST
            </span>
          </div>
        </div>

        {/* Attributes Table */}
        <div className="p-2.5 rounded bg-muted/20 border border-border/60 text-[11px] font-mono space-y-1">
          {isPerson && person && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Upper Attire:</span>
                <span className="font-semibold text-foreground">{person.attributes["clothing"] || "Dark tactical"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gait / Pace:</span>
                <span className="font-semibold text-foreground">{person.attributes["gait"] || "Rapid walking"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Associated Gear:</span>
                <span className="font-semibold text-foreground">{person.attributes["backpack"] || "Rucksack detected"}</span>
              </div>
            </>
          )}

          {!isPerson && vehicle && (
            <>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Color / Make:</span>
                <span className="font-semibold text-foreground">{vehicle.color} SUV</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupants:</span>
                <span className="font-semibold text-foreground">{vehicle.occupants} persons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ANPR Confidence:</span>
                <span className="font-semibold text-primary">0.96 (High)</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/journey" })}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 font-mono text-xs font-semibold transition-colors"
        >
          <span>View Full Cross-Camera Journey</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
