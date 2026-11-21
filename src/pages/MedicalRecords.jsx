
import React, { useEffect, useMemo, useState } from "react";

import {
  getSavedData,
  saveData
} from "../utils/storage";

import { getAppointments } from "../utils/appointmentStorage";

import {
  FileText,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  ClipboardList,
  CalendarDays,
  UserRound,
  Activity,
  ChevronDown,
  FlaskConical,
  Scan,
  FileCheck,
  Clock
} from "lucide-react";

import "./MedicalRecords.css";

const MEDICAL_RECORD_KEY = "doctorMedicalRecords";
const LAB_RESULT_KEY = "labTestResults";
const RADIOLOGY_RESULT_KEY = "radiologyTestResults";

const LAB_OPTIONS = [
  "Complete Blood Count (CBC)",
  "Blood Sugar",
  "Lipid Profile",
  "Thyroid Function Test",
  "Liver Function Test",
  "Kidney Function Test",
  "Urine Test",
  "Hemoglobin"
];

const RADIOLOGY_OPTIONS = [
  "Chest X-Ray",
  "CT Scan",
  "MRI",
  "Ultrasound",
  "ECG",
  "Echocardiogram",
  "Mammography"
];

const emptyForm = {
  patientName: "",
  patientId: "",
  recordDate: new Date().toLocaleDateString("en-CA"),
  diagnosis: "",
  symptoms: "",
  treatment: "",
  medications: "",
  labRequests: [],
  radiologyRequests: [],
  notes: ""
};

const readStorage = (key, fallback) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeRequests = (requests) => {
  if (!requests) return [];

  if (Array.isArray(requests)) {
    return requests.map((item) =>
      typeof item === "string"
        ? item
        : item?.testName || item?.name || item?.test || ""
    ).filter(Boolean);
  }

  if (typeof requests === "string") {
    return requests
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

// Same request ID format used by the Lab Test Results page.
const createRequestId = (record, recordIndex, testIndex, testName) => {
  return `${record.id ?? recordIndex}-${testIndex}-${testName}`;
};

// Multi-select component
function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
  isOpen,
  onToggle
}) {
  return (
    <div className="medical-field full">
      <label className="medical-multiselect-label">
        {label}
      </label>

      <div className="medical-multiselect">
        <button
          type="button"
          className="medical-multiselect-trigger"
          onClick={onToggle}
        >
          <span>
            {selected.length > 0
              ? `${selected.length} test(s) selected`
              : placeholder}
          </span>

          <ChevronDown
            size={17}
            className={
              isOpen
                ? "medical-select-arrow open"
                : "medical-select-arrow"
            }
          />
        </button>

        {isOpen && (
          <div className="medical-multiselect-menu">
            {options.map((option) => (
              <label
                className="medical-multiselect-option"
                key={option}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={() => onChange(option)}
                />

                <span>{option}</span>
              </label>
            ))}
          </div>
        )}

        {selected.length > 0 && (
          <div className="medical-selected-tests">
            {selected.map((item) => (
              <span className="medical-test-tag" key={item}>
                {item}

                <button
                  type="button"
                  onClick={() => onChange(item)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [patients, setPatients] = useState([]);

  const [labResults, setLabResults] = useState({});
  const [radiologyResults, setRadiologyResults] = useState({});

  const [search, setSearch] = useState("");
  const [patientSearch, setPatientSearch] = useState("");

  const [showPatientOptions, setShowPatientOptions] = useState(false);
  const [openDropdown, setOpenDropdown] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const [selectedReport, setSelectedReport] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // Load records, patients and reports.
  const loadData = () => {
    const savedRecords = getSavedData(MEDICAL_RECORD_KEY);
    const appointments = getAppointments();

    setRecords(
      Array.isArray(savedRecords) ? savedRecords : []
    );

    setLabResults(readStorage(LAB_RESULT_KEY, {}));
    setRadiologyResults(readStorage(RADIOLOGY_RESULT_KEY, {}));

    const patientMap = new Map();

    (Array.isArray(appointments) ? appointments : []).forEach(
      (appointment) => {
        const name =
          typeof appointment.patientName === "string"
            ? appointment.patientName
            : typeof appointment.patient === "string"
              ? appointment.patient
              : appointment.patient?.name || "";

        if (!name.trim()) return;

        const patientId =
          appointment.patientId ||
          appointment.patient?.patientId ||
          appointment.patient?.id ||
          "";

        const phone =
          appointment.phone ||
          appointment.patientPhone ||
          appointment.patient?.phone ||
          "";

        const uniqueKey = patientId
          ? `id-${patientId}`
          : phone
            ? `phone-${phone}`
            : `name-${name.trim().toLowerCase()}`;

        const existing = patientMap.get(uniqueKey);

        if (!existing) {
          patientMap.set(uniqueKey, {
            id: uniqueKey,
            patientId,
            name,
            phone,
            age: appointment.age || "",
            gender: appointment.gender || "",
            email: appointment.email || ""
          });
        } else {
          existing.patientId ||= patientId;
          existing.phone ||= phone;
          existing.age ||= appointment.age || "";
          existing.gender ||= appointment.gender || "";
          existing.email ||= appointment.email || "";
        }
      }
    );

    setPatients(Array.from(patientMap.values()));
  };

  useEffect(() => {
    loadData();

    const events = [
      "appointments-updated",
      "doctor-data-updated",
      "lab-results-updated",
      "radiology-results-updated",
      "storage",
      "focus"
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, loadData);
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, loadData);
      });
    };
  }, []);

  // Search patients.
  const filteredPatients = useMemo(() => {
    const searchText = patientSearch.toLowerCase().trim();

    if (!searchText) return patients;

    return patients.filter((patient) =>
      patient.name.toLowerCase().includes(searchText) ||
      String(patient.patientId).toLowerCase().includes(searchText) ||
      String(patient.phone).toLowerCase().includes(searchText)
    );
  }, [patients, patientSearch]);

  // Select patient and automatically fill Patient ID.
  const selectPatient = (patient) => {
    setForm((previous) => ({
      ...previous,
      patientName: patient.name,
      patientId: patient.patientId || ""
    }));

    setPatientSearch(patient.name);
    setShowPatientOptions(false);
  };

  // Toggle lab and radiology requests.
  const toggleRequest = (field, option) => {
    setForm((previous) => {
      const current = previous[field] || [];

      return {
        ...previous,
        [field]: current.includes(option)
          ? current.filter((item) => item !== option)
          : [...current, option]
      };
    });
  };

  // Search medical records.
  const filteredRecords = records.filter((record) => {
    const searchText = search.toLowerCase();

    return (
      (record.patientName || "").toLowerCase().includes(searchText) ||
      String(record.patientId || "").toLowerCase().includes(searchText) ||
      (record.diagnosis || "").toLowerCase().includes(searchText) ||
      (record.recordId || "").toLowerCase().includes(searchText)
    );
  });

  // Update normal form fields.
  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  // Open Add Modal.
  const openAddModal = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setPatientSearch("");
    setShowPatientOptions(false);
    setOpenDropdown("");
    setShowModal(true);
  };

  // Open Edit Modal.
  const openEditModal = (record) => {
    setEditingId(record.id);

    setForm({
      ...emptyForm,
      ...record,
      patientId: record.patientId || "",
      labRequests: normalizeRequests(record.labRequests),
      radiologyRequests: normalizeRequests(record.radiologyRequests)
    });

    setPatientSearch(record.patientName || "");
    setShowPatientOptions(false);
    setOpenDropdown("");
    setShowModal(true);
    setViewRecord(null);
  };

  // Save or update medical record.
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.patientName || !form.patientId) {
      alert("Please select a patient with a valid Patient ID.");
      return;
    }

    if (!form.diagnosis.trim()) {
      alert("Please enter the diagnosis.");
      return;
    }

    let updatedRecords;

    if (editingId !== null) {
      updatedRecords = records.map((record) =>
        record.id === editingId
          ? { ...record, ...form }
          : record
      );
    } else {
      const newRecord = {
        id: Date.now(),
        recordId: `MR-${Date.now().toString().slice(-6)}`,
        ...form
      };

      updatedRecords = [newRecord, ...records];
    }

    saveData(MEDICAL_RECORD_KEY, updatedRecords);

    setRecords(updatedRecords);
    window.dispatchEvent(new Event("doctor-data-updated"));

    setShowModal(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setPatientSearch("");
  };

  // Delete medical record.
  const deleteRecord = (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this medical record?"
      )
    ) {
      return;
    }

    const updatedRecords = records.filter(
      (record) => record.id !== id
    );

    saveData(MEDICAL_RECORD_KEY, updatedRecords);

    setRecords(updatedRecords);
    setViewRecord(null);

    window.dispatchEvent(new Event("doctor-data-updated"));
  };

  const today = new Date().toLocaleDateString("en-CA");

  // Format date.
  const formatDate = (date) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) return date;

    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Get reports belonging to a medical record.
  const getRecordReports = (record, recordIndex, type) => {
    const requests =
      type === "lab"
        ? normalizeRequests(record.labRequests)
        : normalizeRequests(record.radiologyRequests);

    const resultStore =
      type === "lab" ? labResults : radiologyResults;

    return requests.map((testName, testIndex) => {
      const requestId = createRequestId(
        record,
        recordIndex,
        testIndex,
        testName
      );

      const report = resultStore?.[requestId] || null;

      return {
        requestId,
        testName,
        report,
        status: report ? "Completed" : "Pending",
        type
      };
    });
  };

  // Find the current record's index for consistent request IDs.
  const currentRecordIndex = viewRecord
    ? records.findIndex((record) => record.id === viewRecord.id)
    : -1;

  const currentLabReports =
    viewRecord && currentRecordIndex >= 0
      ? getRecordReports(viewRecord, currentRecordIndex, "lab")
      : [];

  const currentRadiologyReports =
    viewRecord && currentRecordIndex >= 0
      ? getRecordReports(viewRecord, currentRecordIndex, "radiology")
      : [];

  const openReport = (item) => {
    setSelectedReport(item);
  };

  const closeReport = () => {
    setSelectedReport(null);
  };

  return (
    <div className="medical-page">

      {/* Page Heading */}
      <div className="medical-heading">
        <div>
          <h1>Medical Records</h1>
          <p>
            Manage patient history, diagnoses, treatment and test reports.
          </p>
        </div>

        <button
          className="medical-add-btn"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Medical Record
        </button>
      </div>

      {/* Statistics */}
      <div className="medical-stats">
        <div className="medical-stat-card">
          <div className="medical-stat-icon purple">
            <FileText size={22} />
          </div>
          <div>
            <p>Total Records</p>
            <h2>{records.length}</h2>
          </div>
        </div>

        <div className="medical-stat-card">
          <div className="medical-stat-icon blue">
            <UserRound size={22} />
          </div>
          <div>
            <p>Patients Recorded</p>
            <h2>
              {new Set(
                records.map((r) => r.patientId).filter(Boolean)
              ).size}
            </h2>
          </div>
        </div>

        <div className="medical-stat-card">
          <div className="medical-stat-icon green">
            <CalendarDays size={22} />
          </div>
          <div>
            <p>Today's Records</p>
            <h2>
              {records.filter((r) => r.recordDate === today).length}
            </h2>
          </div>
        </div>

        <div className="medical-stat-card">
          <div className="medical-stat-icon orange">
            <Activity size={22} />
          </div>
          <div>
            <p>Diagnoses</p>
            <h2>
              {new Set(
                records.map((r) => r.diagnosis).filter(Boolean)
              ).size}
            </h2>
          </div>
        </div>
      </div>

      {/* Medical Records Table */}
      <div className="medical-content">
        <div className="medical-toolbar">
          <div>
            <h2>Patient Medical History</h2>
            <p>View and manage saved medical records and test reports.</p>
          </div>

          <div className="medical-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search patient, ID or diagnosis..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="medical-table-wrap">
          <table className="medical-table">
            <thead>
              <tr>
                <th>Record ID</th>
                <th>Patient Name</th>
                <th>Patient ID</th>
                <th>Diagnosis</th>
                <th>Record Date</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <span className="medical-record-id">
                        {record.recordId || "-"}
                      </span>
                    </td>

                    <td>
                      <div className="medical-patient-cell">
                        <div className="medical-avatar">
                          {(record.patientName || "P")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <strong>{record.patientName}</strong>
                      </div>
                    </td>

                    <td>{record.patientId || "-"}</td>
                    <td>{record.diagnosis}</td>
                    <td>{formatDate(record.recordDate)}</td>

                    <td>
                      <div className="medical-actions">
                        <button
                          title="View Medical Record and Test Reports"
                          className="medical-action view"
                          onClick={() => setViewRecord(record)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          title="Edit"
                          className="medical-action edit"
                          onClick={() => openEditModal(record)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title="Delete"
                          className="medical-action delete"
                          onClick={() => deleteRecord(record.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="medical-empty">
                    <ClipboardList size={36} />
                    <strong>No medical records found</strong>
                    <span>
                      Add a medical record for a current Reception patient.
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Medical Record Modal */}
      {showModal && (
        <div className="medical-overlay">
          <div className="medical-modal">
            <div className="medical-modal-header">
              <div>
                <h2>
                  {editingId !== null
                    ? "Edit Medical Record"
                    : "Add Medical Record"}
                </h2>

                <p>
                  Select a current patient and enter medical information.
                </p>
              </div>

              <button
                className="medical-close"
                type="button"
                onClick={() => setShowModal(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="medical-form-grid">

                {/* Searchable Patient Name */}
                <div className="medical-field patient-select-field">
                  <label>Patient Name *</label>

                  <div className="medical-patient-search">
                    <Search size={18} />

                    <input
                      type="text"
                      value={patientSearch}
                      placeholder="Search current patient..."
                      autoComplete="off"
                      onFocus={() => setShowPatientOptions(true)}
                      onChange={(event) => {
                        setPatientSearch(event.target.value);

                        setForm((previous) => ({
                          ...previous,
                          patientName: "",
                          patientId: ""
                        }));

                        setShowPatientOptions(true);
                      }}
                    />
                  </div>

                  {showPatientOptions && (
                    <div className="medical-patient-options">
                      {filteredPatients.length > 0 ? (
                        filteredPatients.map((patient) => (
                          <button
                            type="button"
                            key={patient.id}
                            className="medical-patient-option"
                            onClick={() => selectPatient(patient)}
                          >
                            <UserRound size={17} />

                            <span>
                              <strong>{patient.name}</strong>
                              <small>
                                {patient.patientId ||
                                  "Patient ID unavailable"}
                              </small>
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="medical-no-patients">
                          No matching patients found.
                        </div>
                      )}
                    </div>
                  )}

                  {patients.length === 0 && (
                    <small className="medical-help-text">
                      No current Reception appointments found.
                    </small>
                  )}
                </div>

                {/* Patient ID */}
                <label className="medical-field">
                  Patient ID *

                  <input
                    type="text"
                    name="patientId"
                    value={form.patientId}
                    placeholder="Automatically filled"
                    readOnly
                    required
                  />
                </label>

                {/* Record Date */}
                <label className="medical-field">
                  Record Date *

                  <input
                    type="date"
                    name="recordDate"
                    value={form.recordDate}
                    onChange={updateField}
                    required
                  />
                </label>

                {/* Diagnosis */}
                <label className="medical-field full">
                  Diagnosis *

                  <input
                    name="diagnosis"
                    value={form.diagnosis}
                    onChange={updateField}
                    placeholder="Enter diagnosis"
                    required
                  />
                </label>

                {/* Symptoms */}
                <label className="medical-field full">
                  Symptoms

                  <textarea
                    name="symptoms"
                    value={form.symptoms}
                    onChange={updateField}
                    placeholder="Describe patient symptoms"
                    rows="3"
                  />
                </label>

                {/* Treatment */}
                <label className="medical-field full">
                  Treatment Plan

                  <textarea
                    name="treatment"
                    value={form.treatment}
                    onChange={updateField}
                    placeholder="Enter treatment details"
                    rows="3"
                  />
                </label>

                {/* Medications */}
                <label className="medical-field full">
                  Medications

                  <textarea
                    name="medications"
                    value={form.medications}
                    onChange={updateField}
                    placeholder="Enter prescribed medications"
                    rows="2"
                  />
                </label>

                {/* Laboratory Requests */}
                <MultiSelectDropdown
                  label="Laboratory Requests"
                  placeholder="Select Laboratory Tests"
                  options={LAB_OPTIONS}
                  selected={form.labRequests}
                  onChange={(option) =>
                    toggleRequest("labRequests", option)
                  }
                  isOpen={openDropdown === "lab"}
                  onToggle={() =>
                    setOpenDropdown(
                      openDropdown === "lab" ? "" : "lab"
                    )
                  }
                />

                {/* Radiology Requests */}
                <MultiSelectDropdown
                  label="Radiology Requests"
                  placeholder="Select Radiology Tests"
                  options={RADIOLOGY_OPTIONS}
                  selected={form.radiologyRequests}
                  onChange={(option) =>
                    toggleRequest("radiologyRequests", option)
                  }
                  isOpen={openDropdown === "radiology"}
                  onToggle={() =>
                    setOpenDropdown(
                      openDropdown === "radiology" ? "" : "radiology"
                    )
                  }
                />

                {/* Notes */}
                <label className="medical-field full">
                  Additional Notes

                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    placeholder="Additional medical notes"
                    rows="3"
                  />
                </label>
              </div>

              <div className="medical-modal-footer">
                <button
                  type="button"
                  className="medical-cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="medical-save-btn"
                >
                  {editingId !== null
                    ? "Update Record"
                    : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Medical Record and Lab/Radiology Reports */}
      {viewRecord && (
        <div className="medical-overlay">
          <div className="medical-modal medical-details-modal">

            <div className="medical-modal-header">
              <div>
                <h2>Medical Record Details</h2>
                <p>{viewRecord.recordId}</p>
              </div>

              <button
                className="medical-close"
                onClick={() => setViewRecord(null)}
              >
                <X size={21} />
              </button>
            </div>

            <div className="medical-details">
              <div className="medical-detail-top">
                <div className="medical-avatar large">
                  {(viewRecord.patientName || "P")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h3>{viewRecord.patientName}</h3>
                  <span>
                    Patient ID: {viewRecord.patientId || "-"}
                  </span>
                  <p>{formatDate(viewRecord.recordDate)}</p>
                </div>
              </div>

              {[
                ["Diagnosis", viewRecord.diagnosis],
                ["Symptoms", viewRecord.symptoms],
                ["Treatment Plan", viewRecord.treatment],
                ["Medications", viewRecord.medications],
                ["Additional Notes", viewRecord.notes]
              ].map(([label, value]) => (
                <div className="medical-detail-item" key={label}>
                  <strong>{label}</strong>
                  <p>{value || "Not provided"}</p>
                </div>
              ))}

              {/* LAB REPORTS */}
              <div className="medical-report-section">
                <h3>
                  <FlaskConical size={19} />
                  Laboratory Test Results
                </h3>

                {currentLabReports.length > 0 ? (
                  <div className="medical-report-list">
                    {currentLabReports.map((item) => (
                      <div
                        className="medical-report-row"
                        key={item.requestId}
                      >
                        <div className="medical-report-info">
                          <strong>{item.testName}</strong>

                          {item.report ? (
                            <span className="medical-report-value">
                              Result: {item.report.resultValue}
                              {" "}
                              {item.report.unit || ""}
                            </span>
                          ) : (
                            <span className="medical-report-pending">
                              <Clock size={14} />
                              Result Pending
                            </span>
                          )}
                        </div>

                        <div className="medical-report-right">
                          <span
                            className={`medical-report-status ${
                              item.report ? "completed" : "pending"
                            }`}
                          >
                            {item.status}
                          </span>

                          {item.report && (
                            <button
                              type="button"
                              className="medical-view-report-btn"
                              onClick={() => openReport(item)}
                            >
                              <Eye size={15} />
                              View Result
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="medical-no-report">
                    No laboratory tests requested.
                  </p>
                )}
              </div>

              {/* RADIOLOGY REPORTS */}
              <div className="medical-report-section">
                <h3>
                  <Scan size={19} />
                  Radiology Test Results
                </h3>

                {currentRadiologyReports.length > 0 ? (
                  <div className="medical-report-list">
                    {currentRadiologyReports.map((item) => (
                      <div
                        className="medical-report-row"
                        key={item.requestId}
                      >
                        <div className="medical-report-info">
                          <strong>{item.testName}</strong>

                          {item.report ? (
                            <span className="medical-report-value">
                              {item.report.findings ||
                                item.report.resultValue ||
                                "Report available"}
                            </span>
                          ) : (
                            <span className="medical-report-pending">
                              <Clock size={14} />
                              Result Pending
                            </span>
                          )}
                        </div>

                        <div className="medical-report-right">
                          <span
                            className={`medical-report-status ${
                              item.report ? "completed" : "pending"
                            }`}
                          >
                            {item.status}
                          </span>

                          {item.report && (
                            <button
                              type="button"
                              className="medical-view-report-btn"
                              onClick={() => openReport(item)}
                            >
                              <Eye size={15} />
                              View Result
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="medical-no-report">
                    No radiology tests requested.
                  </p>
                )}
              </div>
            </div>

            <div className="medical-modal-footer">
              <button
                className="medical-cancel-btn"
                onClick={() => setViewRecord(null)}
              >
                Close
              </button>

              <button
                className="medical-save-btn"
                onClick={() => openEditModal(viewRecord)}
              >
                <Pencil size={16} />
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Individual Lab / Radiology Report */}
      {selectedReport && (
        <div className="medical-overlay">
          <div className="medical-modal medical-report-detail-modal">

            <div className="medical-modal-header">
              <div>
                <h2>
                  {selectedReport.type === "lab"
                    ? "Laboratory Report"
                    : "Radiology Report"}
                </h2>

                <p>{selectedReport.testName}</p>
              </div>

              <button
                className="medical-close"
                onClick={closeReport}
              >
                <X size={21} />
              </button>
            </div>

            <div className="medical-report-document">
              <div className="medical-report-document-heading">
                <FileCheck size={30} />
                <h2>DIAGNOSTIC TEST REPORT</h2>
                <p>
                  {selectedReport.type === "lab"
                    ? "Laboratory Department"
                    : "Radiology Department"}
                </p>
              </div>

              <div className="medical-report-detail-grid">
                <div>
                  <span>Patient Name</span>
                  <strong>{viewRecord.patientName}</strong>
                </div>

                <div>
                  <span>Patient ID</span>
                  <strong>{viewRecord.patientId || "N/A"}</strong>
                </div>

                <div>
                  <span>Test Name</span>
                  <strong>{selectedReport.testName}</strong>
                </div>

                <div>
                  <span>Report Date</span>
                  <strong>
                    {formatDate(
                      selectedReport.report.reportDate ||
                      selectedReport.report.updatedAt
                    )}
                  </strong>
                </div>
              </div>

              {selectedReport.type === "lab" ? (
                <>
                  <h3>Laboratory Findings</h3>

                  <div className="medical-detail-item">
                    <strong>Test Result</strong>
                    <p>
                      {selectedReport.report.resultValue || "N/A"}
                      {" "}
                      {selectedReport.report.unit || ""}
                    </p>
                  </div>

                  <div className="medical-detail-item">
                    <strong>Reference Range</strong>
                    <p>
                      {selectedReport.report.referenceRange || "N/A"}
                    </p>
                  </div>

                  <div className="medical-detail-item">
                    <strong>Interpretation</strong>
                    <p>
                      {selectedReport.report.interpretation || "N/A"}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <h3>Radiology Findings</h3>

                  <div className="medical-detail-item">
                    <strong>Findings</strong>
                    <p>
                      {selectedReport.report.findings ||
                        selectedReport.report.resultValue ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="medical-detail-item">
                    <strong>Impression</strong>
                    <p>
                      {selectedReport.report.impression ||
                        selectedReport.report.interpretation ||
                        "N/A"}
                    </p>
                  </div>

                  <div className="medical-detail-item">
                    <strong>Radiologist Remarks</strong>
                    <p>
                      {selectedReport.report.remarks || "N/A"}
                    </p>
                  </div>
                </>
              )}

              <div className="medical-detail-item">
                <strong>Additional Remarks</strong>
                <p>
                  {selectedReport.report.remarks || "No additional remarks."}
                </p>
              </div>
            </div>

            <div className="medical-modal-footer">
              <button
                className="medical-cancel-btn"
                onClick={closeReport}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default MedicalRecords;
