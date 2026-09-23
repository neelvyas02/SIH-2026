import { riskAssessments } from "@/data/risk";
import { mockDelay, clone } from "@/lib/apiClient";
import type { RiskAssessment } from "@/types";

export const riskService = {
  getAll: async (): Promise<RiskAssessment[]> => {
    return mockDelay(clone(riskAssessments), 120);
  },

  getByIncidentId: async (incidentId: string): Promise<RiskAssessment | null> => {
    const risk = riskAssessments.find(
      (r) => r.subjectType === "incident" && r.subjectId === incidentId
    );
    return mockDelay(risk ? clone(risk) : null, 100);
  },

  getById: async (id: string): Promise<RiskAssessment | null> => {
    const risk = riskAssessments.find((r) => r.id === id);
    return mockDelay(risk ? clone(risk) : null, 80);
  },
};
