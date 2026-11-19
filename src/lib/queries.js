import { useQuery } from "@tanstack/react-query";
import { api, fetchAll } from "./api";

/* Reference lists change rarely: fetch every page once and cache for a few minutes. */
const REF = { staleTime: 5 * 60_000 };

export const useFaculties = () =>
  useQuery({ queryKey: ["faculties"], queryFn: () => fetchAll("staff/faculties/"), ...REF });

export const useDepartments = () =>
  useQuery({ queryKey: ["departments"], queryFn: () => fetchAll("staff/departments/"), ...REF });

export const useStats = (params = {}) =>
  useQuery({ queryKey: ["stats", params], queryFn: () => api("payroll/stats/", { params }) });

/** Every batch (a few per month): small enough to load whole for calendars and lookups. */
export const useAllBatches = () =>
  useQuery({ queryKey: ["batches", "all"], queryFn: () => fetchAll("payroll/batches/") });

export const useMyProfile = () =>
  useQuery({
    queryKey: ["profile", "me"],
    queryFn: async () => {
      try {
        return await api("staff/profiles/me/");
      } catch (e) {
        if (e.status === 404) return null; // account without a staff profile (e.g. a pure administrator)
        throw e;
      }
    },
  });

export function facultyName(faculties, id) {
  return faculties?.find((f) => f.id === id)?.name ?? `Faculty ${id}`;
}
