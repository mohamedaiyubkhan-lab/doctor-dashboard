
const APPOINTMENT_KEY = "hospital_appointments";

export const getAppointments = () => {
  try {
    return JSON.parse(
      localStorage.getItem(APPOINTMENT_KEY) || "[]"
    );
  } catch {
    return [];
  }
};

export const saveAppointments = (appointments) => {
  localStorage.setItem(
    APPOINTMENT_KEY,
    JSON.stringify(appointments)
  );

  window.dispatchEvent(
    new Event("appointments-updated")
  );
};

export const saveAppointment = (appointment) => {
  const appointments = getAppointments();

  saveAppointments([...appointments, appointment]);
};
