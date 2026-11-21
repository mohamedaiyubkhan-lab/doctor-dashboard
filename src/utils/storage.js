
export const PATIENT_KEY = "doctorPatients";
export const APPOINTMENT_KEY = "doctorAppointments";

export function getSavedData(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));

  // Refresh dashboard immediately in the same browser tab
  window.dispatchEvent(new Event("doctor-data-updated"));
}
