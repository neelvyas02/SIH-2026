/**
 * IBVAP domain model.
 * These interfaces mirror the payloads the future backend will return
 * (see src/services/* for the endpoint mapping).
 */

export type Role = "ADMIN" | "COMMANDER" | "OPERATOR" | "INVESTIGATOR";

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  unit: string;
  status: "active" | "disabled";
  lastLogin?: string;
}

export interface Session {
  token: string;
  user: User;
  issuedAt: string;
}

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type CameraStatus = "online" | "offline" | "degraded";
export type AiStatus = "processing" | "idle" | "stopped";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Bop {
  id: string;
  name: string;
  position: GeoPoint;
  sector: string;
  commander: string;
}

export type ZoneType = "restricted" | "bop" | "patrol" | "buffer";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  severity: Severity;
  polygon: GeoPoint[];
  bopId: string;
  activeHours: string;
}

export type FenceShape = "line" | "polygon" | "circle";

export interface VirtualFence {
  id: string;
  name: string;
  shape: FenceShape;
  points: GeoPoint[];
  radiusM?: number;
  severity: Severity;
  direction: "in" | "out" | "both";
  activeHours: string;
  cameraIds: string[];
  alertType: string;
  enabled: boolean;
}

export interface CameraHealth {
  fps: number;
  targetFps: number;
  latencyMs: number;
  blur: boolean;
  obstruction: boolean;
  angleChanged: boolean;
  streamFailures24h: number;
  lastHeartbeat: string;
  uptime7d: number;
}

export interface Camera {
  id: string;
  name: string;
  location: string;
  bopId: string;
  zoneId: string;
  position: GeoPoint;
  bearing: number;
  status: CameraStatus;
  aiStatus: AiStatus;
  streamUrl: string;
  priority: boolean;
  nightVision: boolean;
  personCount: number;
  vehicleCount: number;
  activeAlertIds: string[];
  health: CameraHealth;
  scene: "fence" | "road" | "field" | "checkpost" | "river";
}

export type DetectionKind = "human" | "vehicle" | "face" | "anpr";
export type VehicleClass = "car" | "bike" | "truck" | "bus" | "other";

export interface BoundingBox {
  /** percentages of the frame, 0-100 */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Detection {
  id: string;
  kind: DetectionKind;
  cameraId: string;
  timestamp: string;
  confidence: number;
  bbox: BoundingBox;
  subjectId?: string;
  positionLabel: string;
  /** vehicle */
  vehicleClass?: VehicleClass;
  plate?: string;
  /** face — decided by the backend AI, never by the UI */
  faceMatch?: {
    status: "match" | "no_match" | "review";
    personId?: string;
    confidence: number;
    watchlist?: string;
  };
}

export type AlertType =
  | "Virtual Fence Intrusion"
  | "Night Movement"
  | "Vehicle Detection"
  | "Face Match"
  | "ANPR Hit"
  | "Suspicious Activity"
  | "Camera Failure";

export type AlertStatus = "new" | "acknowledged" | "assigned" | "escalated" | "closed";

export interface Alert {
  id: string;
  severity: Severity;
  type: AlertType;
  cameraId: string;
  zoneId: string;
  bopId: string;
  timestamp: string;
  entityRef?: string;
  description: string;
  status: AlertStatus;
  assignee?: string;
  incidentId?: string;
  detectionId?: string;
}

export interface Person {
  id: string;
  label: string;
  firstSeen: { cameraId: string; timestamp: string };
  lastSeen: { cameraId: string; timestamp: string };
  attributes: Record<string, string>;
  journeyId: string;
  watchlist: boolean;
}

export interface Vehicle {
  id: string;
  plate: string;
  vehicleClass: VehicleClass;
  color: string;
  firstSeen: { cameraId: string; timestamp: string };
  lastSeen: { cameraId: string; timestamp: string };
  journeyId: string;
  occupants: number;
}

export interface JourneyHop {
  cameraId: string;
  enter: string;
  exit: string;
  dwellSeconds: number;
  direction: string;
  alertIds: string[];
}

export interface Journey {
  id: string;
  subjectType: "person" | "vehicle";
  subjectId: string;
  hops: JourneyHop[];
  currentCameraId: string;
  incidentId?: string;
  distanceM: number;
}

export interface RiskFactor {
  label: string;
  weight: number;
  evidence: string;
  present: boolean;
}

export interface RiskAssessment {
  id: string;
  subjectType: "person" | "vehicle" | "incident";
  subjectId: string;
  level: Severity;
  score: number;
  factors: RiskFactor[];
  relatedCameraIds: string[];
  /** Provided by the backend AI engine; the UI only renders it. */
  source: string;
  modelVersion: string;
  computedAt: string;
}

export interface IncidentEvent {
  timestamp: string;
  cameraId?: string;
  title: string;
  detail: string;
  kind: "detection" | "alert" | "movement" | "risk" | "action" | "evidence";
}

export type IncidentStatus = "open" | "investigating" | "contained" | "closed";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  openedAt: string;
  updatedAt: string;
  bopId: string;
  zoneId: string;
  cameraIds: string[];
  personIds: string[];
  vehicleIds: string[];
  alertIds: string[];
  evidenceIds: string[];
  riskId?: string;
  summary: string;
  timeline: IncidentEvent[];
  assignee: string;
}

export type EvidenceType =
  | "snapshot"
  | "video_clip"
  | "detection_frame"
  | "anpr_result"
  | "face_result"
  | "timeline"
  | "location"
  | "track"
  | "note";

export interface Evidence {
  id: string;
  incidentId: string;
  type: EvidenceType;
  cameraId?: string;
  timestamp: string;
  location: string;
  hash: string;
  sizeKb: number;
  notes: string[];
  addedBy: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

export interface InvestigationResultItem {
  kind: "incident" | "camera_sighting" | "alert" | "person" | "vehicle";
  refId: string;
  title: string;
  detail: string;
  timestamp?: string;
  route?: string;
}

export interface InvestigationAnswer {
  query: string;
  answer: string;
  confidence: number;
  results: InvestigationResultItem[];
  source: string;
}

export interface SearchResultGroup {
  group: string;
  items: InvestigationResultItem[];
}

export interface KpiSnapshot {
  totalCameras: number;
  onlineCameras: number;
  offlineCameras: number;
  activeAlerts: number;
  activeIncidents: number;
  personsDetected: number;
  vehiclesDetected: number;
  highPriorityEvents: number;
}
