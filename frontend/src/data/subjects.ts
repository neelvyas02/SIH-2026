import type { Person, Vehicle } from "@/types";

export const persons: Person[] = [
  {
    id: "P102",
    label: "Unidentified male, dark jacket",
    firstSeen: { cameraId: "CAM-03", timestamp: "2026-09-22T18:40:08" },
    lastSeen: { cameraId: "CAM-05", timestamp: "2026-09-22T18:48:22" },
    attributes: {
      Build: "Medium",
      Clothing: "Dark jacket, light trousers",
      Carrying: "Shoulder bag",
      Height: "~172 cm (estimated)",
      Gait: "Fast walk",
    },
    journeyId: "JRN-P102",
    watchlist: false,
  },
  {
    id: "P103",
    label: "Unidentified male, light shirt",
    firstSeen: { cameraId: "CAM-12", timestamp: "2026-09-22T18:31:55" },
    lastSeen: { cameraId: "CAM-12", timestamp: "2026-09-22T18:36:12" },
    attributes: {
      Build: "Slim",
      Clothing: "Light shirt",
      Carrying: "None",
      Height: "~168 cm (estimated)",
      Gait: "Walking",
    },
    journeyId: "JRN-P103",
    watchlist: false,
  },
  {
    id: "P104",
    label: "Authorised patrol member",
    firstSeen: { cameraId: "CAM-08", timestamp: "2026-09-22T18:12:03" },
    lastSeen: { cameraId: "CAM-08", timestamp: "2026-09-22T18:51:40" },
    attributes: {
      Build: "Medium",
      Clothing: "Uniform",
      Carrying: "Standard kit",
      Height: "~175 cm (estimated)",
      Gait: "Patrol pace",
    },
    journeyId: "JRN-P104",
    watchlist: false,
  },
];

export const vehicles: Vehicle[] = [
  {
    id: "V17",
    plate: "GJ01AB1234",
    vehicleClass: "car",
    color: "White",
    firstSeen: { cameraId: "CAM-02", timestamp: "2026-09-22T18:28:41" },
    lastSeen: { cameraId: "CAM-12", timestamp: "2026-09-22T19:10:06" },
    journeyId: "JRN-V17",
    occupants: 2,
  },
  {
    id: "V21",
    plate: "RJ14CD5678",
    vehicleClass: "truck",
    color: "Blue",
    firstSeen: { cameraId: "CAM-18", timestamp: "2026-09-22T17:52:10" },
    lastSeen: { cameraId: "CAM-08", timestamp: "2026-09-22T18:26:34" },
    journeyId: "JRN-V21",
    occupants: 1,
  },
];

export const personById = (id: string) => persons.find((p) => p.id === id);
export const vehicleById = (id: string) => vehicles.find((v) => v.id === id);
