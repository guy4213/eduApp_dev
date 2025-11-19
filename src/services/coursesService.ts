/**
 * Courses Service
 * Re-exports from centralized apiService for backward compatibility
 * @deprecated Consider importing directly from apiService instead
 */
import {
  fetchCourses,
  fetchLessonsForCourses,
  fetchTasksForLessons,
  fetchInstructors,
  fetchCourseInstances
} from "./apiService";

export async function getAllCourses() {
  return fetchCourses();
}

export async function getLessonsForCourses(courseIds: string[]) {
  return fetchLessonsForCourses(courseIds);
}

export async function getTasksForLessons(lessonIds: string[]) {
  return fetchTasksForLessons(lessonIds);
}

export async function getInstructors() {
  return fetchInstructors();
}

export async function getCourseInstances() {
  return fetchCourseInstances();
}