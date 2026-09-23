export interface SeriesPoint {
  label: string;
  [key: string]: string | number;
}

export const eventsPerDay: SeriesPoint[] = [
  { label: "16 Sep", detections: 412, alerts: 38, incidents: 4 },
  { label: "17 Sep", detections: 468, alerts: 44, incidents: 5 },
  { label: "18 Sep", detections: 391, alerts: 31, incidents: 3 },
  { label: "19 Sep", detections: 530, alerts: 52, incidents: 7 },
  { label: "20 Sep", detections: 488, alerts: 46, incidents: 6 },
  { label: "21 Sep", detections: 574, alerts: 61, incidents: 8 },
  { label: "22 Sep", detections: 612, alerts: 68, incidents: 9 },
];

export const eventsPerCamera: SeriesPoint[] = [
  { label: "CAM-03", events: 148, intrusions: 12 },
  { label: "CAM-04", events: 96, intrusions: 9 },
  { label: "CAM-05", events: 118, intrusions: 7 },
  { label: "CAM-08", events: 164, intrusions: 3 },
  { label: "CAM-12", events: 132, intrusions: 8 },
  { label: "CAM-18", events: 104, intrusions: 4 },
  { label: "CAM-11", events: 88, intrusions: 1 },
  { label: "CAM-02", events: 74, intrusions: 2 },
];

export const alertsBySeverity: SeriesPoint[] = [
  { label: "CRITICAL", count: 6 },
  { label: "HIGH", count: 21 },
  { label: "MEDIUM", count: 34 },
  { label: "LOW", count: 47 },
];

export const intrusionsByZone: SeriesPoint[] = [
  { label: "Restricted A", intrusions: 19, nightMovements: 14 },
  { label: "Restricted B", intrusions: 12, nightMovements: 15 },
  { label: "Patrol East", intrusions: 4, nightMovements: 6 },
  { label: "Buffer South", intrusions: 8, nightMovements: 9 },
];

export const cameraUptime: SeriesPoint[] = [
  { label: "CAM-01", uptime: 99.6 },
  { label: "CAM-02", uptime: 99.1 },
  { label: "CAM-03", uptime: 97.4 },
  { label: "CAM-04", uptime: 88.2 },
  { label: "CAM-05", uptime: 94.8 },
  { label: "CAM-07", uptime: 99.9 },
  { label: "CAM-08", uptime: 99.8 },
  { label: "CAM-11", uptime: 98.3 },
  { label: "CAM-12", uptime: 99.4 },
  { label: "CAM-18", uptime: 99.2 },
];

export const incidentResolution: SeriesPoint[] = [
  { label: "16 Sep", opened: 4, closed: 3, avgMinutes: 52 },
  { label: "17 Sep", opened: 5, closed: 5, avgMinutes: 46 },
  { label: "18 Sep", opened: 3, closed: 4, avgMinutes: 41 },
  { label: "19 Sep", opened: 7, closed: 5, avgMinutes: 58 },
  { label: "20 Sep", opened: 6, closed: 6, avgMinutes: 49 },
  { label: "21 Sep", opened: 8, closed: 7, avgMinutes: 44 },
  { label: "22 Sep", opened: 9, closed: 6, avgMinutes: 38 },
];

export const hourlyActivity: SeriesPoint[] = [
  { label: "12:00", persons: 8, vehicles: 5 },
  { label: "14:00", persons: 11, vehicles: 7 },
  { label: "16:00", persons: 14, vehicles: 9 },
  { label: "18:00", persons: 27, vehicles: 12 },
  { label: "20:00", persons: 34, vehicles: 8 },
  { label: "22:00", persons: 29, vehicles: 6 },
  { label: "00:00", persons: 22, vehicles: 4 },
  { label: "02:00", persons: 18, vehicles: 3 },
  { label: "04:00", persons: 12, vehicles: 2 },
  { label: "06:00", persons: 9, vehicles: 5 },
];
