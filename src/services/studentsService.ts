/**
 * Students Service
 * Re-exports from centralized apiService for backward compatibility
 * @deprecated Consider importing directly from apiService instead
 */
import { fetchStudentsByCourseInstance } from "./apiService";

export async function getStudentsByCourseInstance(courseInstanceId: string) {
  return fetchStudentsByCourseInstance(courseInstanceId);
}