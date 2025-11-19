/**
 * Sales Leads Service
 * Re-exports from centralized apiService for backward compatibility
 * @deprecated Consider importing directly from apiService instead
 */
import {
  fetchSalesLeads,
  updateSalesLeadStatus as updateStatus,
  updateSalesLeadValue as updateValue,
  fetchInstructorsDetailed,
  fetchInstitutions,
  findInstitutionByName as findInstitution,
  createInstitution as addInstitution,
  createSalesLead as addSalesLead
} from "./apiService";

export async function listSalesLeads() {
  return fetchSalesLeads();
}

export async function updateSalesLeadStatus(id: string, status: string) {
  return updateStatus(id, status);
}

export async function updateSalesLeadValue(id: string, potentialValue: number) {
  return updateValue(id, potentialValue);
}

export async function getInstructorsForLeads() {
  return fetchInstructorsDetailed();
}

export async function getInstitutions() {
  return fetchInstitutions();
}

export async function findInstitutionByName(name: string) {
  return findInstitution(name);
}

export async function createInstitution(payload: {
  name: string;
  address?: string | null;
  contact_email?: string | null;
  contact_person?: string | null;
  contact_phone?: string | null;
}) {
  return addInstitution(payload);
}

export async function createSalesLead(payload: any) {
  return addSalesLead(payload);
}
