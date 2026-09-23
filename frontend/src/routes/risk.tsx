import React, { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { riskService } from "@/services/riskService";
import { cameraService } from "@/services/cameraService";
import type { RiskAssessment, Camera } from "@/types";
import { RiskGauge } from "@/components/risk/RiskGauge";
import { RiskFactorList } from "@/components/risk/RiskFactorList";
import { CameraDetailModal } from "@/components/surveillance/CameraDetailModal";
import { Flame, Camera as CameraIcon, ArrowRight, ShieldAlert, Cpu } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/risk")({
  component: RiskPage,
});

function RiskPage() {
  const [assessments, setAssessments] = useState<RiskAssessment[]>([]);
  const [selectedRiskId, setSelectedRiskId] = useState("RSK-241");
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    riskService.getAll().then((list) => setAssessments(list));
  }, []);

  const activeRisk = assessments.find((r) => r.id === selectedRiskId) ?? assessments[0];

  const handleInspectCamera = async (cameraId: string) => {
    const cam = await cameraService.getById(cameraId);
    if (cam) setSelectedCamera(cam);
  };

  return (
    <ProtectedRoute allowedRoles={["ADMIN", "COMMANDER", "INVESTIGATOR", "OPERATOR"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-high" />
              <h1 className="text-xl font-display font-bold text-foreground tracking-tight">
                Explainable AI Threat Risk Analysis
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-high/15 text-high border border-high/30 uppercase font-semibold">
                MODEL: {activeRisk?.modelVersion ?? "risk-v1.4.2"}
              </span>
            </div>
            <p className="text-xs font-mono text-muted-foreground mt-0.5">
              Transparent Multi-Factor Risk Derivation Engine · Explainable Weight Attribution · Related Sensor Correlation
            </p>
          </div>
        </div>

        {/* Assessment Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {assessments.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedRiskId(r.id)}
              className={`px-3 py-1.5 rounded-md font-mono text-xs font-semibold tracking-wider transition-colors shrink-0 ${
                r.id === activeRisk?.id
                  ? "bg-high text-high-foreground shadow-xs"
                  : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground border border-border/80"
              }`}
            >
              <span>{r.id} · {r.subjectId} (Score: {r.score})</span>
            </button>
          ))}
        </div>

        {/* Primary Explainability Grid */}
        {activeRisk && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Gauge & Model Info */}
            <div className="lg:col-span-1 space-y-4">
              <RiskGauge risk={activeRisk} />

              {/* Related Cameras Chain Card */}
              <div className="p-4 rounded-lg border border-border bg-card space-y-3 font-mono text-xs">
                <span className="font-bold text-foreground uppercase tracking-wider block">
                  Sensor Correlation Sequence
                </span>
                <p className="text-muted-foreground text-[11px]">
                  Cameras observing entity trajectory contributing to this risk evaluation:
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {activeRisk.relatedCameraIds.map((camId, idx) => (
                    <React.Fragment key={camId}>
                      <button
                        onClick={() => handleInspectCamera(camId)}
                        className="px-2.5 py-1 rounded bg-secondary hover:bg-secondary/80 border border-border text-primary font-bold flex items-center gap-1 transition-colors"
                      >
                        <CameraIcon className="w-3.5 h-3.5" />
                        <span>{camId}</span>
                      </button>
                      {idx < activeRisk.relatedCameraIds.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="pt-2 border-t border-border/60">
                  <button
                    onClick={() => navigate({ to: `/incidents/${activeRisk.subjectId}` })}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded bg-high/15 text-high border border-high/30 font-semibold hover:bg-high/25 transition-colors"
                  >
                    <span>Inspect Incident Story ({activeRisk.subjectId})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Factor Weighting Breakdown */}
            <div className="lg:col-span-2">
              <RiskFactorList factors={activeRisk.factors} />
            </div>
          </div>
        )}

        {/* Camera Modal */}
        <CameraDetailModal
          camera={selectedCamera}
          open={!!selectedCamera}
          onClose={() => setSelectedCamera(null)}
        />
      </div>
    </ProtectedRoute>
  );
}
