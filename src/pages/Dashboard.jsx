
import React, { useEffect, useState } from "react";
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle,
  TrendingUp,
  UserRound,
  ArrowUpRight,
  Activity,
  Stethoscope
} from "lucide-react";

import {
  PATIENT_KEY,
  getSavedData
} from "../utils/storage";

import {
  getAppointments
} from "../utils/appointmentStorage";

import "./Dashboard.css";

function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);

  const today = new Date().toLocaleDateString("en-CA");

  // Support Reception and Doctor appointment field names
  const getDate = (item) =>
    item.date || item.appointmentDate || "";

  const getTime = (item) =>
    item.time || item.appointmentTime || "";

  const getPatientName = (appointment) =>
    appointment.patientName ||
    appointment.patient ||
    "Unknown Patient";

  // Load dashboard data
  const loadDashboardData = () => {
    setPatients(getSavedData(PATIENT_KEY) || []);
    setAppointments(getAppointments() || []);
  };

  useEffect(() => {
    loadDashboardData();

    window.addEventListener(
      "appointments-updated",
      loadDashboardData
    );

    window.addEventListener(
      "storage",
      loadDashboardData
    );

    window.addEventListener(
      "focus",
      loadDashboardData
    );

    return () => {
      window.removeEventListener(
        "appointments-updated",
        loadDashboardData
      );

      window.removeEventListener(
        "storage",
        loadDashboardData
      );

      window.removeEventListener(
        "focus",
        loadDashboardData
      );
    };
  }, []);

  // Appointment statistics
  const todayAppointments = appointments.filter(
    (item) => getDate(item) === today
  );

  const pendingAppointments = appointments.filter(
    (item) =>
      !item.status ||
      item.status === "Pending" ||
      item.status === "Scheduled"
  );

  const completedAppointments = appointments.filter(
    (item) => item.status === "Completed"
  );

  const confirmedAppointments = appointments.filter(
    (item) => item.status === "Confirmed"
  );

  const cancelledAppointments = appointments.filter(
    (item) => item.status === "Cancelled"
  );

  // Recent appointments
  const recentAppointments = [...appointments]
    .sort((a, b) => {
      const dateA = `${getDate(a)}T${getTime(a) || "00:00"}`;
      const dateB = `${getDate(b)}T${getTime(b) || "00:00"}`;

      return dateB.localeCompare(dateA);
    })
    .slice(0, 5);

  // Today's schedule
  const schedule = [...todayAppointments].sort((a, b) =>
    getTime(a).localeCompare(getTime(b))
  );

  // Format time
  const formatTime = (time) => {
    if (!time) return "Not set";

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

  // Format date
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

  const getStatusClass = (status) => {
    return (status || "Pending").toLowerCase();
  };

  return (
    <div className="dashboard-page">

      {/* Welcome Section */}
      <section className="welcome-banner">
        <div>
          <span className="welcome-tag">
            <Stethoscope size={15} />
            DOCTOR PORTAL
          </span>

          <h1>Welcome Back, Doctor!</h1>

          <p>
            Here's what's happening with your hospital today.
          </p>

          <div className="welcome-date">
            <CalendarDays size={17} />
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </div>
        </div>

        <div className="welcome-icon">
          <Activity size={65} />
        </div>
      </section>

      {/* Statistics Cards */}
      <section className="dashboard-stats">

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon blue">
              <Users size={23} />
            </div>
            <span className="stat-trend">
              <ArrowUpRight size={15} />
              Patients
            </span>
          </div>

          <h2>{patients.length}</h2>
          <p>Total Patients</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon purple">
              <CalendarDays size={23} />
            </div>
            <span className="stat-trend">
              <ArrowUpRight size={15} />
              Today
            </span>
          </div>

          <h2>{todayAppointments.length}</h2>
          <p>Today's Appointments</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon orange">
              <Clock size={23} />
            </div>
            <span className="stat-trend">Waiting</span>
          </div>

          <h2>{pendingAppointments.length}</h2>
          <p>Pending Appointments</p>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            <div className="stat-icon green">
              <CheckCircle size={23} />
            </div>
            <span className="stat-trend">Finished</span>
          </div>

          <h2>{completedAppointments.length}</h2>
          <p>Completed Appointments</p>
        </div>

      </section>

      {/* Appointment Overview */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Appointment Overview</h2>
            <p>Current appointment status summary</p>
          </div>
        </div>

        <div className="overview-grid">

          <div className="overview-card">
            <div className="overview-icon confirmed">
              <CheckCircle size={21} />
            </div>
            <div>
              <h3>{confirmedAppointments.length}</h3>
              <p>Confirmed</p>
            </div>
          </div>

          <div className="overview-card">
            <div className="overview-icon pending">
              <Clock size={21} />
            </div>
            <div>
              <h3>{pendingAppointments.length}</h3>
              <p>Pending</p>
            </div>
          </div>

          <div className="overview-card">
            <div className="overview-icon completed">
              <TrendingUp size={21} />
            </div>
            <div>
              <h3>{completedAppointments.length}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div className="overview-card">
            <div className="overview-icon cancelled">
              <Users size={21} />
            </div>
            <div>
              <h3>{cancelledAppointments.length}</h3>
              <p>Cancelled</p>
            </div>
          </div>

        </div>
      </section>

      {/* Recent Appointments and Today's Schedule */}
      <section className="dashboard-bottom">

        {/* Recent Appointments */}
        <div className="dashboard-panel recent-panel">
          <div className="section-heading">
            <div>
              <h2>Recent Appointments</h2>
              <p>Latest patient appointments from Reception</p>
            </div>
          </div>

          {recentAppointments.length === 0 ? (
            <div className="dashboard-empty">
              <CalendarDays size={35} />
              <h3>No appointments yet</h3>
              <p>New Reception appointments will appear here.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentAppointments.map((appointment, index) => (
                    <tr key={appointment.id || index}>
                      <td>
                        <div className="patient-cell">
                          <div className="patient-avatar">
                            <UserRound size={17} />
                          </div>
                          <span>
                            {getPatientName(appointment)}
                          </span>
                        </div>
                      </td>

                      <td>{formatDate(getDate(appointment))}</td>

                      <td>{formatTime(getTime(appointment))}</td>

                      <td>
                        <span
                          className={`status-badge ${getStatusClass(
                            appointment.status
                          )}`}
                        >
                          {appointment.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Today's Schedule */}
        <div className="dashboard-panel schedule-panel">
          <div className="section-heading">
            <div>
              <h2>Today's Schedule</h2>
              <p>Your daily patient schedule</p>
            </div>

            <span className="schedule-count">
              {schedule.length} Visits
            </span>
          </div>

          {schedule.length === 0 ? (
            <div className="dashboard-empty">
              <Clock size={35} />
              <h3>No visits today</h3>
              <p>Your schedule is currently clear.</p>
            </div>
          ) : (
            <div className="schedule-list">
              {schedule.map((appointment, index) => (
                <div
                  className="schedule-item"
                  key={appointment.id || index}
                >
                  <div className="schedule-time">
                    {formatTime(getTime(appointment))}
                  </div>

                  <div className="schedule-line"></div>

                  <div className="schedule-details">
                    <h4>{getPatientName(appointment)}</h4>

                    <p>
                      {appointment.reason || "General Consultation"}
                    </p>

                    <span
                      className={`status-badge ${getStatusClass(
                        appointment.status
                      )}`}
                    >
                      {appointment.status || "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>
    </div>
  );
}

export default Dashboard;
