import { mockDelay, clone } from "@/lib/apiClient";
import { incidents } from "@/data/incidents";
import { alerts } from "@/data/alerts";
import { cameras } from "@/data/cameras";

export interface ShiftReport {
  id: string;
  shiftName: string;
  date: string;
  timeWindow: string;
  dutyOfficer: string;
  bopId: string;
  sector: string;
  totalAlertsHandled: number;
  criticalBreaches: number;
  incidentsRaised: number;
  activeQrtDispatches: number;
  cameraAvailabilityPct: number;
  avgResponseTimeSec: number;
  handoverRemarks: string;
  handoverSignedBy?: string;
  handoverTimestamp?: string;
  dispatches: {
    id: string;
    unit: string;
    targetLocation: string;
    dispatchedAt: string;
    status: "dispatched" | "on-scene" | "contained" | "returned";
    objective: string;
  }[];
  incidentSummaries: {
    id: string;
    title: string;
    severity: string;
    status: string;
    location: string;
    summary: string;
  }[];
  equipmentIssues: {
    cameraId: string;
    issue: string;
    loggedAt: string;
    actionTaken: string;
  }[];
}

const mockReports: ShiftReport[] = [
  {
    id: "REP-20260922-EVE",
    shiftName: "Evening Shift",
    date: "2026-09-22",
    timeWindow: "14:00 - 22:00 IST",
    dutyOfficer: "Cmdr. D. Kaur (ID: BOP4-CMD-09)",
    bopId: "BOP-04",
    sector: "Sector WEST-9 Central",
    totalAlertsHandled: 14,
    criticalBreaches: 2,
    incidentsRaised: 2,
    activeQrtDispatches: 1,
    cameraAvailabilityPct: 94.4,
    avgResponseTimeSec: 102,
    handoverRemarks:
      "Subject P102 breached Virtual Fence VF-01 at 18:42. QRT Cheetah-1 successfully deployed to culvert sector. CAM-04 lens obstruction telemetry logged; technical squad requested for morning shift maintenance.",
    handoverSignedBy: "Cmdr. D. Kaur",
    handoverTimestamp: "2026-09-22T21:55:00",
    dispatches: [
      {
        id: "DSP-882",
        unit: "QRT Cheetah-1 (BOP-04)",
        targetLocation: "Culvert South of CAM-05",
        dispatchedAt: "2026-09-22T18:52:40",
        status: "on-scene",
        objective: "Intercept suspicious entity P102 moving along dry creek bed.",
      },
      {
        id: "DSP-880",
        unit: "Patrol Viper-2 (BOP-01)",
        targetLocation: "North Gap Perimeter (CAM-12)",
        dispatchedAt: "2026-09-22T18:35:10",
        status: "contained",
        objective: "Verify thermal night contact reported by CAM-12.",
      },
    ],
    incidentSummaries: [
      {
        id: "INC-241",
        title: "Perimeter Breach & Multi-Camera Incursion",
        severity: "CRITICAL",
        status: "investigating",
        location: "BOP-04 · Restricted Zone A",
        summary:
          "Intruder P102 crossed virtual fence at CAM-03, traversed blind spot at obstructed CAM-04, re-acquired at CAM-05. Risk score 82.",
      },
      {
        id: "INC-218",
        title: "Unverified Night Movement Near Post",
        severity: "HIGH",
        status: "contained",
        location: "BOP-01 · Restricted Zone B",
        summary: "Thermal contact at 18:31. Patrol Viper-2 deployed, perimeter secured.",
      },
    ],
    equipmentIssues: [
      {
        cameraId: "CAM-04",
        issue: "Lens obstruction / low SNR detected by AI health diagnostic.",
        loggedAt: "2026-09-22T18:43:00",
        actionTaken: "Manual inspection scheduled; neighboring PTZ CAM-03 slewed south.",
      },
    ],
  },
  {
    id: "REP-20260922-MOR",
    shiftName: "Morning Shift",
    date: "2026-09-22",
    timeWindow: "06:00 - 14:00 IST",
    dutyOfficer: "Cmdr. A. Rathore (ID: BOP1-CMD-01)",
    bopId: "BOP-01",
    sector: "Sector WEST-9 North",
    totalAlertsHandled: 8,
    criticalBreaches: 0,
    incidentsRaised: 1,
    activeQrtDispatches: 0,
    cameraAvailabilityPct: 100.0,
    avgResponseTimeSec: 85,
    handoverRemarks:
      "Routine perimeter reconnaissance completed. ANPR corridor checkpost operational with 100% plate capture fidelity.",
    handoverSignedBy: "Cmdr. A. Rathore",
    handoverTimestamp: "2026-09-22T13:58:00",
    dispatches: [],
    incidentSummaries: [
      {
        id: "INC-194",
        title: "Vehicle Loitering Near East Checkpost",
        severity: "MEDIUM",
        status: "closed",
        location: "BOP-02 · Patrol Corridor",
        summary: "Commercial carrier loitering over 15 minutes. Driver verified and cleared.",
      },
    ],
    equipmentIssues: [],
  },
];

let liveReports: ShiftReport[] = clone(mockReports);

export const reportService = {
  getAll: async (): Promise<ShiftReport[]> => {
    return mockDelay(clone(liveReports), 100);
  },

  getById: async (id: string): Promise<ShiftReport | null> => {
    const report = liveReports.find((r) => r.id === id);
    return mockDelay(report ? clone(report) : null, 80);
  },

  updateHandoverRemarks: async (id: string, remarks: string, signer?: string): Promise<ShiftReport> => {
    const idx = liveReports.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Report ${id} not found`);
    liveReports[idx] = {
      ...liveReports[idx],
      handoverRemarks: remarks,
      handoverSignedBy: signer || liveReports[idx].handoverSignedBy,
      handoverTimestamp: new Date().toISOString(),
    };
    return mockDelay(clone(liveReports[idx]), 120);
  },

  signReport: async (id: string, signerName: string): Promise<ShiftReport> => {
    const idx = liveReports.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Report ${id} not found`);
    liveReports[idx] = {
      ...liveReports[idx],
      handoverSignedBy: signerName,
      handoverTimestamp: new Date().toISOString(),
    };
    return mockDelay(clone(liveReports[idx]), 120);
  },
};
