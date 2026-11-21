
import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Eye,
  X,
  Phone,
  UserRound,
  Activity,
  CalendarDays,
  Stethoscope
} from "lucide-react";

import { getAppointments } from "../utils/appointmentStorage";

import "./Patients.css";

function Patients() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [viewPatient, setViewPatient] = useState(null);

  // Get appointment data from Reception
  const loadPatients = () => {
    const appointments = getAppointments();

    // Convert appointment records into patient records
    const patientMap = new Map();

    appointments.forEach((appointment, index) => {
      const name =
        appointment.patientName ||
        appointment.patient ||
        "";

      const phone = appointment.phone || "";
      const patientId =
        appointment.patientId ||
        appointment.id ||
        `PAT-${index + 1}`;

      if (!name.trim()) return;

      // Use phone or patient ID to avoid duplicates
      const uniqueKey = phone
        ? phone.trim()
        : patientId;

      const existingPatient = patientMap.get(uniqueKey);

      const patientData = {
        id: patientId,
        name,
        age: appointment.age || "",
        gender: appointment.gender || "",
        phone,
        email: appointment.email || "",
        bloodGroup: appointment.bloodGroup || "",
        address: appointment.address || "",
        appointments: [
          {
            date:
              appointment.date ||
              appointment.appointmentDate ||
              "",
            time:
              appointment.time ||
              appointment.appointmentTime ||
              "",
            doctor:
              appointment.doctorName ||
              appointment.doctor ||
              "Not assigned",
            reason:
              appointment.reason ||
              "General Consultation",
            status: appointment.status || "Pending"
          }
        ]
      };

      if (existingPatient) {
        existingPatient.appointments.push(
          ...patientData.appointments
        );

        // Keep any available patient details
        existingPatient.age ||= patientData.age;
        existingPatient.gender ||= patientData.gender;
        existingPatient.email ||= patientData.email;
        existingPatient.bloodGroup ||= patientData.bloodGroup;
        existingPatient.address ||= patientData.address;
      } else {
        patientMap.set(uniqueKey, patientData);
      }
    });

    setPatients(Array.from(patientMap.values()));
  };

  useEffect(() => {
    loadPatients();

    window.addEventListener(
      "appointments-updated",
      loadPatients
    );

    window.addEventListener(
      "storage",
      loadPatients
    );

    window.addEventListener(
      "focus",
      loadPatients
    );

    return () => {
      window.removeEventListener(
        "appointments-updated",
        loadPatients
      );

      window.removeEventListener(
        "storage",
        loadPatients
      );

      window.removeEventListener(
        "focus",
        loadPatients
      );
    };
  }, []);

  // Statistics
  const maleCount = patients.filter(
    (patient) => patient.gender?.toLowerCase() === "male"
  ).length;

  const femaleCount = patients.filter(
    (patient) => patient.gender?.toLowerCase() === "female"
  ).length;

  // Search
  const filteredPatients = patients.filter((patient) => {
    const searchText = search.toLowerCase();

    return (
      patient.name.toLowerCase().includes(searchText) ||
      String(patient.phone).toLowerCase().includes(searchText) ||
      String(patient.email).toLowerCase().includes(searchText) ||
      String(patient.id).toLowerCase().includes(searchText)
    );
  });

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatTime = (time) => {
    if (!time) return "-";

    if (time.includes("AM") || time.includes("PM")) {
      return time;
    }

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="patients-page">

      {/* Header */}
      <div className="patients-header">
        <div>
          <span className="patients-label">
            DOCTOR PORTAL
          </span>

          <h1>Patient Records</h1>

          <p>
            View patient information received from Reception appointments.
          </p>
        </div>

        <div className="patients-header-icon">
          <Users size={36} />
        </div>
      </div>

      {/* Statistics */}
      <div className="patients-stats">

        <div className="patient-stat-card">
          <div className="patient-stat-icon blue">
            <Users size={23} />
          </div>

          <div>
            <h2>{patients.length}</h2>
            <p>Total Patients</p>
          </div>
        </div>

        <div className="patient-stat-card">
          <div className="patient-stat-icon purple">
            <UserRound size={23} />
          </div>

          <div>
            <h2>{maleCount}</h2>
            <p>Male Patients</p>
          </div>
        </div>

        <div className="patient-stat-card">
          <div className="patient-stat-icon pink">
            <Users size={23} />
          </div>

          <div>
            <h2>{femaleCount}</h2>
            <p>Female Patients</p>
          </div>
        </div>

        <div className="patient-stat-card">
          <div className="patient-stat-icon green">
            <Activity size={23} />
          </div>

          <div>
            <h2>
              {patients.reduce(
                (total, patient) =>
                  total + patient.appointments.length,
                0
              )}
            </h2>

            <p>Total Appointments</p>
          </div>
        </div>

      </div>

      {/* Patient Records */}
      <div className="patients-table-card">

        <div className="patients-table-heading">
          <div>
            <h2>Patient Records</h2>
            <p>Reception registered patients - View only</p>
          </div>

          <span className="patient-record-count">
            {filteredPatients.length} Patients
          </span>
        </div>

        {/* Search */}
        <div className="patients-toolbar">
          <div className="patients-search">
            <Search size={19} />

            <input
              type="text"
              placeholder="Search by patient name, ID, phone or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Patient Table */}
        <div className="patients-table-wrapper">
          <table className="patients-table">

            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Patient ID</th>
                <th>Age / Gender</th>
                <th>Phone</th>
                <th>Appointments</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPatients.length > 0 ? (
                filteredPatients.map((patient) => (
                  <tr key={patient.id}>

                    <td>
                      <div className="patient-profile-cell">
                        <div className="patient-profile-avatar">
                          <UserRound size={19} />
                        </div>

                        <div>
                          <h4>{patient.name}</h4>
                          <p>{patient.email || "No email"}</p>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="patient-id">
                        {patient.id}
                      </span>
                    </td>

                    <td>
                      {patient.age || "-"} / {patient.gender || "-"}
                    </td>

                    <td>
                      <span className="patient-phone">
                        <Phone size={14} />
                        {patient.phone || "-"}
                      </span>
                    </td>

                    <td>
                      <span className="blood-group">
                        {patient.appointments.length}
                      </span>
                    </td>

                    <td>
                      <div className="patient-actions">
                        <button
                          title="View patient"
                          className="patient-view-btn"
                          onClick={() => setViewPatient(patient)}
                        >
                          <Eye size={17} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">
                    <div className="patients-empty">
                      <Users size={42} />

                      <h3>No patients found</h3>

                      <p>
                        Book an appointment from Reception to see patient details here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>

      {/* View Patient Modal */}
      {viewPatient && (
        <div
          className="patient-modal-overlay"
          onClick={() => setViewPatient(null)}
        >
          <div
            className="patient-modal patient-view-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="patient-modal-header">
              <div>
                <h2>Patient Details</h2>
                <p>Patient information and appointment history</p>
              </div>

              <button
                className="patient-close-btn"
                onClick={() => setViewPatient(null)}
              >
                <X size={21} />
              </button>
            </div>

            <div className="patient-detail-profile">
              <div className="patient-detail-avatar">
                <UserRound size={32} />
              </div>

              <h3>{viewPatient.name}</h3>

              <span>{viewPatient.id}</span>
            </div>

            <div className="patient-detail-grid">

              <div>
                <span>Age</span>
                <strong>{viewPatient.age || "-"}</strong>
              </div>

              <div>
                <span>Gender</span>
                <strong>{viewPatient.gender || "-"}</strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>{viewPatient.phone || "-"}</strong>
              </div>

              <div>
                <span>Email</span>
                <strong>{viewPatient.email || "-"}</strong>
              </div>

              <div>
                <span>Blood Group</span>
                <strong>{viewPatient.bloodGroup || "-"}</strong>
              </div>

              <div>
                <span>Address</span>
                <strong>{viewPatient.address || "-"}</strong>
              </div>

            </div>

            {/* Appointment History */}
            <div className="patient-appointment-history">
              <h3>
                <CalendarDays size={19} />
                Appointment History
              </h3>

              {viewPatient.appointments.map((appointment, index) => (
                <div
                  className="patient-appointment-item"
                  key={index}
                >
                  <div>
                    <strong>{formatDate(appointment.date)}</strong>
                    <p>{formatTime(appointment.time)}</p>
                  </div>

                  <div>
                    <strong>
                      <Stethoscope size={14} />
                      {appointment.doctor}
                    </strong>
                    <p>{appointment.reason}</p>
                  </div>

                  <span className="patient-appointment-status">
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Patients;
