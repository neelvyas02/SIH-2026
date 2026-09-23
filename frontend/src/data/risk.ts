import type { RiskAssessment } from "@/types";

/**
 * Risk assessments are produced by the backend AI engine.
 * The UI renders them verbatim and never derives a level itself.
 */
export const riskAssessments: RiskAssessment[] = [
  {
    id: "RSK-241",
    subjectType: "incident",
    subjectId: "INC-241",
    level: "HIGH",
    score: 82,
    source: "IBVAP Risk Engine (backend)",
    modelVersion: "risk-v1.4.2",
    computedAt: "2026-09-22T18:49:05",
    relatedCameraIds: ["CAM-03", "CAM-04", "CAM-05"],
    factors: [
      {
        label: "Restricted zone entry",
        weight: 28,
        evidence: "P102 inside ZN-RESTRICTED-A at 18:42:12 (CAM-03)",
        present: true,
      },
      {
        label: "Night-time movement",
        weight: 18,
        evidence: "Event window 18:40–18:52 is past light-fade threshold",
        present: true,
      },
      {
        label: "Border-facing direction",
        weight: 16,
        evidence: "Track heading 265° sustained across two cameras",
        present: true,
      },
      {
        label: "Extended presence",
        weight: 12,
        evidence: "Cumulative dwell 8 min 6 s inside restricted perimeter",
        present: true,
      },
      {
        label: "Cross-camera movement",
        weight: 8,
        evidence: "CAM-03 → CAM-04 → CAM-05 re-identification chain",
        present: true,
      },
      {
        label: "Associated vehicle proximity",
        weight: 6,
        evidence: "V17 (GJ01AB1234) on service track at 18:47:05",
        present: true,
      },
      {
        label: "Watchlist face match",
        weight: 0,
        evidence: "No watchlist match returned for P102",
        present: false,
      },
    ],
  },
  {
    id: "RSK-218",
    subjectType: "incident",
    subjectId: "INC-218",
    level: "MEDIUM",
    score: 54,
    source: "IBVAP Risk Engine (backend)",
    modelVersion: "risk-v1.4.2",
    computedAt: "2026-09-22T18:38:40",
    relatedCameraIds: ["CAM-12"],
    factors: [
      {
        label: "Night-time movement",
        weight: 20,
        evidence: "Thermal contact at 18:31:55 inside active fence hours",
        present: true,
      },
      {
        label: "Restricted zone entry",
        weight: 18,
        evidence: "Contact inside ZN-RESTRICTED-B boundary",
        present: true,
      },
      {
        label: "Extended presence",
        weight: 10,
        evidence: "Dwell 4 min 17 s at north gap",
        present: true,
      },
      {
        label: "Cross-camera movement",
        weight: 6,
        evidence: "Single-camera contact only, no re-identification",
        present: false,
      },
      {
        label: "Border-facing direction",
        weight: 6,
        evidence: "Heading north-west, oblique to fence line",
        present: false,
      },
    ],
  },
  {
    id: "RSK-194",
    subjectType: "incident",
    subjectId: "INC-194",
    level: "LOW",
    score: 27,
    source: "IBVAP Risk Engine (backend)",
    modelVersion: "risk-v1.4.2",
    computedAt: "2026-09-22T17:45:12",
    relatedCameraIds: ["CAM-11"],
    factors: [
      {
        label: "Repeated motion triggers",
        weight: 14,
        evidence: "9 triggers in 20 min on CAM-11",
        present: true,
      },
      {
        label: "Sensor degradation",
        weight: 13,
        evidence: "Partial lens obstruction reported by health monitor",
        present: true,
      },
      {
        label: "Restricted zone entry",
        weight: 0,
        evidence: "All triggers inside patrol corridor, not restricted zone",
        present: false,
      },
      {
        label: "Night-time movement",
        weight: 0,
        evidence: "Daylight window",
        present: false,
      },
    ],
  },
  {
    id: "RSK-P102",
    subjectType: "person",
    subjectId: "P102",
    level: "HIGH",
    score: 79,
    source: "IBVAP Risk Engine (backend)",
    modelVersion: "risk-v1.4.2",
    computedAt: "2026-09-22T18:48:55",
    relatedCameraIds: ["CAM-03", "CAM-04", "CAM-05"],
    factors: [
      {
        label: "Restricted zone entry",
        weight: 30,
        evidence: "Entered ZN-RESTRICTED-A at 18:42:12",
        present: true,
      },
      {
        label: "Cross-camera movement",
        weight: 20,
        evidence: "3 cameras in 8 minutes",
        present: true,
      },
      {
        label: "Night-time movement",
        weight: 17,
        evidence: "All sightings after light-fade",
        present: true,
      },
      {
        label: "Border-facing direction",
        weight: 12,
        evidence: "Sustained westward heading",
        present: true,
      },
    ],
  },
];

export const riskBySubject = (subjectId: string) =>
  riskAssessments.find((r) => r.subjectId === subjectId);
