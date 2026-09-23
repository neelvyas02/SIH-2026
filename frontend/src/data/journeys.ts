import type { Journey } from "@/types";

export const journeys: Journey[] = [
  {
    id: "JRN-P102",
    subjectType: "person",
    subjectId: "P102",
    currentCameraId: "CAM-05",
    incidentId: "INC-241",
    distanceM: 1420,
    hops: [
      {
        cameraId: "CAM-03",
        enter: "2026-09-22T18:40:08",
        exit: "2026-09-22T18:42:47",
        dwellSeconds: 159,
        direction: "West · toward border",
        alertIds: ["ALT-103", "ALT-102"],
      },
      {
        cameraId: "CAM-04",
        enter: "2026-09-22T18:43:51",
        exit: "2026-09-22T18:45:30",
        dwellSeconds: 99,
        direction: "South-west",
        alertIds: ["ALT-104"],
      },
      {
        cameraId: "CAM-05",
        enter: "2026-09-22T18:48:22",
        exit: "2026-09-22T18:52:10",
        dwellSeconds: 228,
        direction: "South · toward culvert",
        alertIds: ["ALT-110"],
      },
      {
        cameraId: "CAM-07",
        enter: "2026-09-22T18:56:02",
        exit: "2026-09-22T18:58:44",
        dwellSeconds: 162,
        direction: "South-east (predicted path)",
        alertIds: [],
      },
    ],
  },
  {
    id: "JRN-P103",
    subjectType: "person",
    subjectId: "P103",
    currentCameraId: "CAM-12",
    incidentId: "INC-218",
    distanceM: 260,
    hops: [
      {
        cameraId: "CAM-12",
        enter: "2026-09-22T18:31:55",
        exit: "2026-09-22T18:36:12",
        dwellSeconds: 257,
        direction: "North-west",
        alertIds: ["ALT-106"],
      },
    ],
  },
  {
    id: "JRN-P104",
    subjectType: "person",
    subjectId: "P104",
    currentCameraId: "CAM-08",
    distanceM: 180,
    hops: [
      {
        cameraId: "CAM-08",
        enter: "2026-09-22T18:12:03",
        exit: "2026-09-22T18:51:40",
        dwellSeconds: 2377,
        direction: "Static · gate duty",
        alertIds: ["ALT-109"],
      },
    ],
  },
  {
    id: "JRN-V17",
    subjectType: "vehicle",
    subjectId: "V17",
    currentCameraId: "CAM-12",
    incidentId: "INC-241",
    distanceM: 9840,
    hops: [
      {
        cameraId: "CAM-02",
        enter: "2026-09-22T18:28:41",
        exit: "2026-09-22T18:30:02",
        dwellSeconds: 81,
        direction: "South-east",
        alertIds: [],
      },
      {
        cameraId: "CAM-03",
        enter: "2026-09-22T18:47:05",
        exit: "2026-09-22T18:49:12",
        dwellSeconds: 127,
        direction: "East along service track",
        alertIds: [],
      },
      {
        cameraId: "CAM-08",
        enter: "2026-09-22T18:55:18",
        exit: "2026-09-22T18:58:40",
        dwellSeconds: 202,
        direction: "North-east",
        alertIds: ["ALT-105"],
      },
      {
        cameraId: "CAM-12",
        enter: "2026-09-22T19:10:06",
        exit: "2026-09-22T19:12:30",
        dwellSeconds: 144,
        direction: "North-west · outbound",
        alertIds: [],
      },
    ],
  },
  {
    id: "JRN-V21",
    subjectType: "vehicle",
    subjectId: "V21",
    currentCameraId: "CAM-08",
    distanceM: 7100,
    hops: [
      {
        cameraId: "CAM-18",
        enter: "2026-09-22T17:52:10",
        exit: "2026-09-22T17:56:20",
        dwellSeconds: 250,
        direction: "North",
        alertIds: [],
      },
      {
        cameraId: "CAM-08",
        enter: "2026-09-22T18:26:34",
        exit: "2026-09-22T18:34:02",
        dwellSeconds: 448,
        direction: "Static · inspection",
        alertIds: [],
      },
    ],
  },
];

export const journeyById = (id: string) => journeys.find((j) => j.id === id);
export const journeyBySubject = (subjectId: string) =>
  journeys.find((j) => j.subjectId === subjectId);
