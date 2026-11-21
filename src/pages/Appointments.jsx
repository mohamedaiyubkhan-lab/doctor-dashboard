
import React, { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Search,
  Clock,
  CheckCircle,
  Users,
  Edit,
  Trash2,
  X,
  Filter
} from "lucide-react";

import {
  getAppointments,
  saveAppointments
} from "../utils/appointmentStorage";

import "./Appointments.css";

function Appointments() {

  const [appointments, setAppointments] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [editingAppointment, setEditingAppointment] = useState(null);

  // Support both Reception and Doctor field names
  const getDate = (item) =>
    item.date || item.appointmentDate || "";

  const getTime = (item) =>
    item.time || item.appointmentTime || "";

  const getPatientName = (item) =>
    item.patientName || item.patient || "Unknown Patient";

  const today = new Date().toLocaleDateString("en-CA");

  // Load appointments
  const loadAppointments = () => {
    setAppointments(getAppointments());
  };

  useEffect(() => {
    loadAppointments();

    window.addEventListener(
      "appointments-updated",
      loadAppointments
    );

    window.addEventListener(
      "storage",
      loadAppointments
    );

    return () => {
      window.removeEventListener(
        "appointments-updated",
        loadAppointments
      );

      window.removeEventListener(
        "storage",
        loadAppointments
      );
    };
  }, []);

  // Statistics
  const todayCount = appointments.filter(
    (item) => getDate(item) === today
  ).length;

  const confirmedCount = appointments.filter(
    (item) => item.status === "Confirmed"
  ).length;

  const pendingCount = appointments.filter(
    (item) =>
      !item.status || item.status === "Pending" ||
      item.status === "Scheduled"
  ).length;

  const completedCount = appointments.filter(
    (item) => item.status === "Completed"
  ).length;

  // Search and filter
  const filteredAppointments = useMemo(() => {

    return appointments
      .filter((item) => {

        const patientName = getPatientName(item);
        const searchText = search.toLowerCase();

        const matchesSearch =
          patientName.toLowerCase().includes(searchText) ||
          (item.phone || "").toLowerCase().includes(searchText) ||
          (item.reason || "").toLowerCase().includes(searchText);

        const matchesStatus =
          statusFilter === "All" ||
          (item.status || "Pending") === statusFilter ||
          (statusFilter === "Pending" &&
            item.status === "Scheduled");

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dateA = `${getDate(a)}T${getTime(a)}`;
        const dateB = `${getDate(b)}T${getTime(b)}`;

        return dateA.localeCompare(dateB);
      });

  }, [appointments, search, statusFilter]);

  // Update status
  const updateStatus = (id, newStatus) => {

    const updated = appointments.map((item) =>
      item.id === id
        ? { ...item, status: newStatus }
        : item
    );

    saveAppointments(updated);
    setAppointments(updated);
  };

  // Delete appointment
  const deleteAppointment = (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this appointment?"
    );

    if (!confirmDelete) return;

    const updated = appointments.filter(
      (item) => item.id !== id
    );

    saveAppointments(updated);
    setAppointments(updated);
  };

  // Edit appointment
  const openEditModal = (appointment) => {
    setEditingAppointment({
      ...appointment,
      date: getDate(appointment),
      time: getTime(appointment)
    });
  };

  const handleEditChange = (e) => {

    const { name, value } = e.target;

    setEditingAppointment((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const saveEditedAppointment = (e) => {

    e.preventDefault();

    if (!editingAppointment) return;

    const updated = appointments.map((item) =>
      item.id === editingAppointment.id
        ? {
            ...item,
            date: editingAppointment.date,
            time: editingAppointment.time,
            appointmentDate: editingAppointment.date,
            appointmentTime: editingAppointment.time,
            reason: editingAppointment.reason,
            status: editingAppointment.status
          }
        : item
    );

    saveAppointments(updated);
    setAppointments(updated);
    setEditingAppointment(null);
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

  // Format time
  const formatTime = (time) => {

    if (!time) return "-";

    if (time.includes("AM") || time.includes("PM")) {
      return time;
    }

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes));

    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (

    <div className="appointments-page">

      {/* Page Header */}

      <div className="appointment-page-header">

        <div>
          <span className="appointment-label">
            DOCTOR PORTAL
          </span>

          <h1>Appointments</h1>

          <p>
            View and manage your patient appointments.
          </p>
        </div>

        <div className="appointment-header-icon">
          <CalendarDays size={35} />
        </div>

      </div>

      {/* Statistics */}

      <div className="appointment-stats">

        <div className="appointment-stat-card">
          <div className="appointment-stat-icon blue">
            <CalendarDays size={22} />
          </div>

          <div>
            <h2>{appointments.length}</h2>
            <p>Total Appointments</p>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="appointment-stat-icon purple">
            <Clock size={22} />
          </div>

          <div>
            <h2>{todayCount}</h2>
            <p>Today's Appointments</p>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="appointment-stat-icon orange">
            <Users size={22} />
          </div>

          <div>
            <h2>{pendingCount}</h2>
            <p>Pending Appointments</p>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="appointment-stat-icon green">
            <CheckCircle size={22} />
          </div>

          <div>
            <h2>{completedCount}</h2>
            <p>Completed Appointments</p>
          </div>
        </div>

      </div>

      {/* Appointment Table */}

      <div className="appointment-table-card">

        <div className="appointment-table-header">

          <div>
            <h2>Appointment List</h2>
            <p>Manage your scheduled patient visits</p>
          </div>

          <span className="appointment-total">
            {filteredAppointments.length} Records
          </span>

        </div>

        {/* Search and Filter */}

        <div className="appointment-toolbar">

          <div className="appointment-search">

            <Search size={19} />

            <input
              type="text"
              placeholder="Search patient, phone or reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

          </div>

          <div className="appointment-filter">

            <Filter size={17} />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

          </div>

        </div>

        {/* Appointment List */}

        <div className="appointment-table-wrapper">

          <table className="appointment-table">

            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Date</th>
                <th>Time</th>
                <th>Reason</th>
                <th>Status</th>
                
              </tr>
            </thead>

            <tbody>

              {filteredAppointments.length > 0 ? (

                filteredAppointments.map((item) => (

                  <tr key={item.id}>

                    <td>
                      <div className="appointment-patient">

                        <div className="appointment-avatar">
                          <Users size={18} />
                        </div>

                        <div>
                          <h4>{getPatientName(item)}</h4>
                          <p>{item.phone || "No phone number"}</p>
                          <small>{item.patientId || ""}</small>
                        </div>

                      </div>
                    </td>

                    <td>{formatDate(getDate(item))}</td>

                    <td>
                      <span className="appointment-time">
                        <Clock size={14} />
                        {formatTime(getTime(item))}
                      </span>
                    </td>

                    <td>
                      {item.reason || "General Consultation"}
                    </td>

                    <td>
                      <select
                        className={`appointment-status-select ${
                          (item.status || "Pending").toLowerCase()
                        }`}
                        value={
                          item.status === "Scheduled"
                            ? "Pending"
                            : item.status || "Pending"
                        }
                        onChange={(e) =>
                          updateStatus(item.id, e.target.value)
                        }
                      >
                        <option value="Pending">Pending</option>
                        
                        <option value="Completed">Completed</option>
                        
                      </select>
                    </td>

                    

                  </tr>

                ))

              ) : (

                <tr>
                  <td colSpan="6">

                    <div className="appointment-empty">

                      <CalendarDays size={42} />

                      <h3>No appointments found</h3>

                      <p>
                        No appointment records match your search or filter.
                      </p>

                    </div>

                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* Edit Appointment Modal */}

      {editingAppointment && (

        <div
          className="appointment-modal-overlay"
          onClick={() => setEditingAppointment(null)}
        >

          <div
            className="appointment-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="appointment-modal-header">

              <div>
                <h2>Edit Appointment</h2>
                <p>Update patient appointment details</p>
              </div>

              <button
                type="button"
                className="appointment-close-btn"
                onClick={() => setEditingAppointment(null)}
              >
                <X size={21} />
              </button>

            </div>

            <form onSubmit={saveEditedAppointment}>

              <div className="appointment-form-group">
                <label>Patient Name</label>

                <input
                  type="text"
                  value={getPatientName(editingAppointment)}
                  disabled
                />
              </div>

              <div className="appointment-form-row">

                <div className="appointment-form-group">
                  <label>Appointment Date</label>

                  <input
                    type="date"
                    name="date"
                    value={editingAppointment.date || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>

                <div className="appointment-form-group">
                  <label>Appointment Time</label>

                  <input
                    type="time"
                    name="time"
                    value={editingAppointment.time || ""}
                    onChange={handleEditChange}
                    required
                  />
                </div>

              </div>

              <div className="appointment-form-group">
                <label>Reason for Visit</label>

                <textarea
                  name="reason"
                  value={editingAppointment.reason || ""}
                  onChange={handleEditChange}
                  rows="3"
                  placeholder="Enter reason for visit"
                />
              </div>

              <div className="appointment-form-group">
                <label>Appointment Status</label>

                <select
                  name="status"
                  value={editingAppointment.status || "Pending"}
                  onChange={handleEditChange}
                >
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="appointment-modal-actions">

                <button
                  type="button"
                  className="appointment-cancel-btn"
                  onClick={() => setEditingAppointment(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="appointment-save-btn"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Appointments;
