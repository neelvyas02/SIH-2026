import { mockDelay } from "@/lib/apiClient";
import type { InvestigationAnswer, InvestigationResultItem } from "@/types";

export const investigationService = {
  /**
   * Natural Language Investigation Engine.
   * Mirrors POST /api/investigation/query.
   */
  query: async (prompt: string): Promise<InvestigationAnswer> => {
    const q = prompt.toLowerCase().trim();

    // Query 1: BOP-04 night intrusions
    if (q.includes("bop-04") || q.includes("bop 04") || q.includes("night-time") || q.includes("intrusion")) {
      const results: InvestigationResultItem[] = [
        {
          kind: "incident",
          refId: "INC-241",
          title: "INC-241: Restricted zone intrusion — Salt Flats fence line",
          detail: "Individual P102 crossed Fence Line Alpha after dark. Vehicle V17 noted on service track. Severity: HIGH.",
          timestamp: "2026-09-22T18:42:12",
          route: "/incidents/INC-241",
        },
        {
          kind: "incident",
          refId: "INC-218",
          title: "INC-218: Thermal contact at Night Perimeter Bravo",
          detail: "Subject P103 detected moving north-west across CAM-12 sector during zero-illumination window.",
          timestamp: "2026-09-21T21:14:02",
          route: "/incidents/INC-218",
        },
        {
          kind: "incident",
          refId: "INC-194",
          title: "INC-194: Fence sensor alarm and visual correlation at Sector A",
          detail: "Vibration tripwire tripped on post 14. CAM-03 confirmed non-wildlife human approach. Contained.",
          timestamp: "2026-09-18T02:40:18",
          route: "/incidents/INC-194",
        },
      ];

      return mockDelay({
        query: prompt,
        answer: "Found 3 night-time intrusion incidents near BOP-04 within the requested timeframe. Primary active event is INC-241 currently under investigation with high risk score (82).",
        confidence: 0.94,
        results,
        source: "IBVAP Operational Knowledge Base v2.4 (Mock Backend)",
      }, 350);
    }

    // Query 2: Vehicle sightings
    if (q.includes("gj01ab1234") || q.includes("vehicle") || q.includes("car") || q.includes("v17")) {
      const results: InvestigationResultItem[] = [
        {
          kind: "camera_sighting",
          refId: "CAM-03",
          title: "CAM-03 (BOP-04 Salt Flats)",
          detail: "Vehicle V17 (White SUV, GJ01AB1234) detected parked on perimeter track adjacent to fence line.",
          timestamp: "2026-09-22T18:47:05",
          route: "/surveillance",
        },
        {
          kind: "camera_sighting",
          refId: "CAM-08",
          title: "CAM-08 (BOP-02 Sandtrack Checkpost)",
          detail: "ANPR match plate recorded at gate barricade, occupants: 2, traveling eastbound.",
          timestamp: "2026-09-22T18:55:21",
          route: "/detections/anpr",
        },
        {
          kind: "camera_sighting",
          refId: "CAM-12",
          title: "CAM-12 (BOP-01 Kharu West)",
          detail: "Earlier sighting at junction checkpoint, verified entry permit.",
          timestamp: "2026-09-22T17:15:40",
          route: "/surveillance",
        },
      ];

      return mockDelay({
        query: prompt,
        answer: "Vehicle GJ01AB1234 (ID: V17) was recorded across 3 camera checkpoints today. Most critical sighting is adjacent to Incident INC-241 at CAM-03.",
        confidence: 0.98,
        results,
        source: "ANPR Correlator & Sighting Tracker",
      }, 300);
    }

    // Fallback general query
    const results: InvestigationResultItem[] = [
      {
        kind: "incident",
        refId: "INC-241",
        title: "INC-241: Restricted zone intrusion — Salt Flats",
        detail: "Active priority incident involving Person P102 across CAM-03, CAM-04, CAM-05.",
        timestamp: "2026-09-22T18:42:12",
        route: "/incidents/INC-241",
      },
      {
        kind: "alert",
        refId: "ALT-102",
        title: "ALT-102: Virtual Fence Intrusion (HIGH)",
        detail: "CAM-03 at BOP-04. Subject P102 penetrated perimeter zone.",
        timestamp: "2026-09-22T18:42:12",
        route: "/alerts",
      },
    ];

    return mockDelay({
      query: prompt,
      answer: `Analysis complete for "${prompt}". Retrieved correlated events, active sightings, and matching incident records.`,
      confidence: 0.88,
      results,
      source: "IBVAP NLP Inference Engine",
    }, 280);
  },
};
