import { journeys } from "@/data/journeys";
import { persons, vehicles } from "@/data/subjects";
import { mockDelay, clone } from "@/lib/apiClient";
import type { Journey, Person, Vehicle } from "@/types";

export const trackingService = {
  getPersons: async (): Promise<Person[]> => {
    return mockDelay(clone(persons), 100);
  },

  getPersonById: async (id: string): Promise<Person | null> => {
    const p = persons.find((item) => item.id === id);
    return mockDelay(p ? clone(p) : null, 80);
  },

  getVehicles: async (): Promise<Vehicle[]> => {
    return mockDelay(clone(vehicles), 100);
  },

  getVehicleById: async (id: string): Promise<Vehicle | null> => {
    const v = vehicles.find((item) => item.id === id);
    return mockDelay(v ? clone(v) : null, 80);
  },

  getJourneys: async (): Promise<Journey[]> => {
    return mockDelay(clone(journeys), 100);
  },

  getJourneyBySubjectId: async (subjectId: string): Promise<Journey | null> => {
    const j = journeys.find((item) => item.subjectId === subjectId);
    return mockDelay(j ? clone(j) : null, 80);
  },
};
