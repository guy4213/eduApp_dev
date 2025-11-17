/**
 * Instructors Service
 * Re-exports from centralized apiService for backward compatibility
 * @deprecated Consider importing directly from apiService instead
 */
import { fetchInstructors } from "./apiService";

export async function listInstructorsBasic() {
  return fetchInstructors();
}