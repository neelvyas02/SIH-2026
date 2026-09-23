import type { Bop, Zone, VirtualFence } from "@/types";

/**
 * Synthetic operational area — "Sector WEST-9, Rann Frontier (fictional)".
 * No real border-security locations are used anywhere in this prototype.
 */
export const OPERATIONAL_AREA = {
  name: "Sector WEST-9 (synthetic)",
  center: { lat: 23.842, lng: 70.412 },
  defaultZoom: 12,
};

export const bops: Bop[] = [
  {
    id: "BOP-01",
    name: "BOP-01 Kharu Post",
    position: { lat: 23.8712, lng: 70.3612 },
    sector: "WEST-9 North",
    commander: "Cmdr. A. Rathore",
  },
  {
    id: "BOP-02",
    name: "BOP-02 Sandtrack Post",
    position: { lat: 23.8558, lng: 70.4498 },
    sector: "WEST-9 East",
    commander: "Cmdr. S. Menon",
  },
  {
    id: "BOP-04",
    name: "BOP-04 Salt Flats Post",
    position: { lat: 23.8215, lng: 70.3925 },
    sector: "WEST-9 Central",
    commander: "Cmdr. D. Kaur",
  },
];

export const zones: Zone[] = [
  {
    id: "ZN-RESTRICTED-A",
    name: "Restricted Zone A — Fence Line",
    type: "restricted",
    severity: "CRITICAL",
    bopId: "BOP-04",
    activeHours: "24x7",
    polygon: [
      { lat: 23.8305, lng: 70.3805 },
      { lat: 23.8318, lng: 70.4032 },
      { lat: 23.8188, lng: 70.4048 },
      { lat: 23.8172, lng: 70.3818 },
    ],
  },
  {
    id: "ZN-RESTRICTED-B",
    name: "Restricted Zone B — North Gap",
    type: "restricted",
    severity: "HIGH",
    bopId: "BOP-01",
    activeHours: "18:00 - 06:00",
    polygon: [
      { lat: 23.8792, lng: 70.3492 },
      { lat: 23.8805, lng: 70.3702 },
      { lat: 23.8668, lng: 70.3712 },
      { lat: 23.8655, lng: 70.3505 },
    ],
  },
  {
    id: "ZN-PATROL-E",
    name: "Patrol Corridor East",
    type: "patrol",
    severity: "MEDIUM",
    bopId: "BOP-02",
    activeHours: "24x7",
    polygon: [
      { lat: 23.8625, lng: 70.4352 },
      { lat: 23.8642, lng: 70.4622 },
      { lat: 23.8462, lng: 70.4635 },
      { lat: 23.8448, lng: 70.4365 },
    ],
  },
  {
    id: "ZN-BUFFER-S",
    name: "Buffer Zone South",
    type: "buffer",
    severity: "LOW",
    bopId: "BOP-04",
    activeHours: "24x7",
    polygon: [
      { lat: 23.8108, lng: 70.3862 },
      { lat: 23.8122, lng: 70.4142 },
      { lat: 23.7985, lng: 70.4155 },
      { lat: 23.7972, lng: 70.3875 },
    ],
  },
];

export const virtualFences: VirtualFence[] = [
  {
    id: "VF-01",
    name: "Fence Line Alpha",
    shape: "line",
    points: [
      { lat: 23.8308, lng: 70.3812 },
      { lat: 23.8302, lng: 70.3968 },
      { lat: 23.8281, lng: 70.4041 },
    ],
    severity: "CRITICAL",
    direction: "both",
    activeHours: "24x7",
    cameraIds: ["CAM-03", "CAM-04"],
    alertType: "Virtual Fence Intrusion",
    enabled: true,
  },
  {
    id: "VF-02",
    name: "Night Perimeter Bravo",
    shape: "polygon",
    points: [
      { lat: 23.8792, lng: 70.3492 },
      { lat: 23.8805, lng: 70.3702 },
      { lat: 23.8668, lng: 70.3712 },
      { lat: 23.8655, lng: 70.3505 },
    ],
    severity: "HIGH",
    direction: "in",
    activeHours: "18:00 - 06:00",
    cameraIds: ["CAM-01", "CAM-12"],
    alertType: "Night Movement",
    enabled: true,
  },
  {
    id: "VF-03",
    name: "Checkpost Approach Circle",
    shape: "circle",
    points: [{ lat: 23.8558, lng: 70.4498 }],
    radiusM: 420,
    severity: "MEDIUM",
    direction: "in",
    activeHours: "24x7",
    cameraIds: ["CAM-08"],
    alertType: "Vehicle Detection",
    enabled: true,
  },
  {
    id: "VF-04",
    name: "Salt Flats Track Line",
    shape: "line",
    points: [
      { lat: 23.8192, lng: 70.3898 },
      { lat: 23.8148, lng: 70.4022 },
    ],
    severity: "LOW",
    direction: "out",
    activeHours: "24x7",
    cameraIds: ["CAM-05", "CAM-18"],
    alertType: "Suspicious Activity",
    enabled: false,
  },
];
