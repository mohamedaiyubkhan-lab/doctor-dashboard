
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  X,
  Printer,
  Pill,
  ClipboardList,
  CalendarDays,
  UserRound,
  FileText,
  ChevronDown
} from "lucide-react";

import { getSavedData, saveData } from "../utils/storage";
import { getAppointments } from "../utils/appointmentStorage";
import "./Prescriptions.css";

const PRESCRIPTION_KEY = "doctorPrescriptions";

const getToday = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const emptyMedicine = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: ""
};

const emptyForm = {
  patientName: "",
  patientId: "",
  prescriptionDate: getToday(),
  diagnosis: "",
  medicines: [{ ...emptyMedicine }],
  notes: ""
};

function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [viewPrescription, setViewPrescription] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });

  // Custom patient dropdown states
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);

  // --------------------------------------------------
  // LOAD PRESCRIPTIONS AND RECEPTION PATIENTS
  // --------------------------------------------------

  const loadData = () => {
    const savedPrescriptions = getSavedData(PRESCRIPTION_KEY) || [];
    setPrescriptions(
      Array.isArray(savedPrescriptions) ? savedPrescriptions : []
    );

    const appointments = getAppointments() || [];
    const patientMap = new Map();

    appointments.forEach((appointment) => {
      const rawPatient = appointment.patient;

      const rawName =
        appointment.patientName ||
        (typeof rawPatient === "string" ? rawPatient : "") ||
        rawPatient?.name ||
        rawPatient?.patientName ||
        "";

      const patientName =
        typeof rawName === "string" ? rawName.trim() : "";

      const patientId =
        appointment.patientId ||
        rawPatient?.patientId ||
        rawPatient?.id ||
        "";

      const phone =
        appointment.phone ||
        appointment.patientPhone ||
        rawPatient?.phone ||
        "";

      if (!patientName) return;

      const key = patientId
        ? `id-${patientId}`
        : phone
        ? `phone-${phone}`
        : `name-${patientName.toLowerCase()}`;

      if (!patientMap.has(key)) {
        patientMap.set(key, {
          patientName,
          patientId: String(patientId),
          phone
        });
      }
    });

    setPatients(Array.from(patientMap.values()));
  };

  useEffect(() => {
    loadData();

    window.addEventListener("doctor-data-updated", loadData);
    window.addEventListener("appointments-updated", loadData);
    window.addEventListener("storage", loadData);
    window.addEventListener("focus", loadData);

    return () => {
      window.removeEventListener("doctor-data-updated", loadData);
      window.removeEventListener("appointments-updated", loadData);
      window.removeEventListener("storage", loadData);
      window.removeEventListener("focus", loadData);
    };
  }, []);

  // --------------------------------------------------
  // SAVE PRESCRIPTIONS
  // --------------------------------------------------

  const updatePrescriptionStorage = (updatedPrescriptions) => {
    setPrescriptions(updatedPrescriptions);
    saveData(PRESCRIPTION_KEY, updatedPrescriptions);
    window.dispatchEvent(new Event("doctor-data-updated"));
  };

  // --------------------------------------------------
  // PATIENT SEARCH AND SELECTION
  // --------------------------------------------------

  const filteredPatients = useMemo(() => {
    const search = patientSearch.toLowerCase().trim();

    if (!search) return patients;

    return patients.filter((patient) =>
      patient.patientName.toLowerCase().includes(search)
    );
  }, [patients, patientSearch]);

  const selectPatient = (patient) => {
    setForm((previous) => ({
      ...previous,
      patientName: patient.patientName,
      patientId: patient.patientId
    }));

    setPatientSearch(patient.patientName);
    setShowPatientDropdown(false);
  };

  const handlePatientSearch = (event) => {
    const value = event.target.value;

    setPatientSearch(value);
    setShowPatientDropdown(true);

    // Clear selected patient until a dropdown result is selected
    setForm((previous) => ({
      ...previous,
      patientName: "",
      patientId: ""
    }));
  };

  // --------------------------------------------------
  // FORM HANDLERS
  // --------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleMedicineChange = (index, event) => {
    const { name, value } = event.target;

    setForm((previous) => {
      const medicines = [...previous.medicines];

      medicines[index] = {
        ...medicines[index],
        [name]: value
      };

      return {
        ...previous,
        medicines
      };
    });
  };

  const addMedicine = () => {
    setForm((previous) => ({
      ...previous,
      medicines: [
        ...previous.medicines,
        { ...emptyMedicine }
      ]
    }));
  };

  const removeMedicine = (index) => {
    setForm((previous) => ({
      ...previous,
      medicines:
        previous.medicines.length > 1
          ? previous.medicines.filter((_, i) => i !== index)
          : [{ ...emptyMedicine }]
    }));
  };

  // --------------------------------------------------
  // OPEN ADD MODAL
  // --------------------------------------------------

  const openAddModal = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      prescriptionDate: getToday(),
      medicines: [{ ...emptyMedicine }]
    });

    setPatientSearch("");
    setShowPatientDropdown(false);
    setShowModal(true);
  };

  // --------------------------------------------------
  // OPEN EDIT MODAL
  // --------------------------------------------------

  const openEditModal = (prescription) => {
    setEditingId(prescription.id);

    const patientName = prescription.patientName || "";

    setForm({
      patientName,
      patientId: prescription.patientId || "",
      prescriptionDate:
        prescription.prescriptionDate || getToday(),
      diagnosis: prescription.diagnosis || "",
      medicines:
        Array.isArray(prescription.medicines) &&
        prescription.medicines.length > 0
          ? prescription.medicines.map((medicine) => ({
              ...emptyMedicine,
              ...medicine
            }))
          : [{ ...emptyMedicine }],
      notes: prescription.notes || ""
    });

    setPatientSearch(patientName);
    setShowPatientDropdown(false);
    setShowModal(true);
  };

  // --------------------------------------------------
  // CLOSE MODAL
  // --------------------------------------------------

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setShowPatientDropdown(false);
  };

  // --------------------------------------------------
  // SUBMIT PRESCRIPTION
  // --------------------------------------------------

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.patientName.trim() || !form.patientId.trim()) {
      alert("Please select a patient with a valid Patient ID.");
      return;
    }

    if (!form.diagnosis.trim()) {
      alert("Please enter a diagnosis.");
      return;
    }

    const validMedicines = form.medicines.filter(
      (medicine) => medicine.name.trim()
    );

    if (validMedicines.length === 0) {
      alert("Please enter at least one medicine.");
      return;
    }

    const prescriptionData = {
      ...form,
      id: editingId || `PRE-${Date.now()}`,
      patientName: form.patientName.trim(),
      patientId: form.patientId.trim(),
      diagnosis: form.diagnosis.trim(),
      medicines: validMedicines,
      notes: form.notes.trim()
    };

    let updatedPrescriptions;

    if (editingId) {
      updatedPrescriptions = prescriptions.map((item) =>
        item.id === editingId ? prescriptionData : item
      );
    } else {
      updatedPrescriptions = [
        prescriptionData,
        ...prescriptions
      ];
    }

    updatePrescriptionStorage(updatedPrescriptions);
    closeModal();
  };

  // --------------------------------------------------
  // DELETE PRESCRIPTION
  // --------------------------------------------------

  const deletePrescription = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this prescription?"
    );

    if (!confirmDelete) return;

    const updatedPrescriptions = prescriptions.filter(
      (item) => item.id !== id
    );

    updatePrescriptionStorage(updatedPrescriptions);

    if (viewPrescription?.id === id) {
      setViewPrescription(null);
    }
  };

  // --------------------------------------------------
  // VIEW PRESCRIPTION
  // --------------------------------------------------

  const openViewModal = (prescription) => {
    setViewPrescription(prescription);
  };

  // --------------------------------------------------
  // PRINT PRESCRIPTION
  // --------------------------------------------------

  const printPrescription = (item) => {
    const escapeHTML = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (character) => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        };

        return entities[character];
      });

    const medicineRows = (item.medicines || [])
      .map(
        (medicine, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(medicine.name)}</td>
            <td>${escapeHTML(medicine.dosage)}</td>
            <td>${escapeHTML(medicine.frequency)}</td>
            <td>${escapeHTML(medicine.duration)}</td>
            <td>${escapeHTML(medicine.quantity)}</td>
          </tr>
        `
      )
      .join("");

    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow pop-ups to print the prescription.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${escapeHTML(item.patientName)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 35px;
              color: #222;
            }

            h1 {
              text-align: center;
              margin-bottom: 5px;
            }

            .subtitle {
              text-align: center;
              color: #666;
              margin-bottom: 30px;
            }

            .info {
              margin: 12px 0;
              font-size: 14px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }

            th, td {
              border: 1px solid #ccc;
              padding: 10px;
              text-align: left;
              font-size: 13px;
            }

            th {
              background: #f1f3f8;
            }

            .section {
              margin-top: 25px;
            }

            .signature {
              margin-top: 70px;
              text-align: right;
            }

            @media print {
              body { padding: 15px; }
            }
          </style>
        </head>

        <body>
          <h1>Hospital Prescription</h1>
          <div class="subtitle">Medical Prescription</div>

          <div class="info">
            <strong>Patient Name:</strong>
            ${escapeHTML(item.patientName)}
          </div>

          <div class="info">
            <strong>Patient ID:</strong>
            ${escapeHTML(item.patientId || "Unavailable")}
          </div>

          <div class="info">
            <strong>Date:</strong>
            ${escapeHTML(item.prescriptionDate)}
          </div>

          <div class="section">
            <strong>Diagnosis:</strong>
            <p>${escapeHTML(item.diagnosis)}</p>
          </div>

          <div class="section">
            <h3>Medicines</h3>

            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Quantity</th>
                </tr>
              </thead>

              <tbody>
                ${medicineRows}
              </tbody>
            </table>
          </div>

          ${
            item.notes
              ? `
                <div class="section">
                  <strong>Additional Notes:</strong>
                  <p>${escapeHTML(item.notes)}</p>
                </div>
              `
              : ""
          }

          <div class="signature">
            _______________________<br />
            Doctor Signature
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  // --------------------------------------------------
  // SEARCH FILTER
  // --------------------------------------------------

  const filteredPrescriptions = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    return prescriptions.filter((item) => {
      return (
        (item.patientName || "").toLowerCase().includes(search) ||
        (item.patientId || "").toLowerCase().includes(search) ||
        (item.diagnosis || "").toLowerCase().includes(search) ||
        String(item.id || "").toLowerCase().includes(search)
      );
    });
  }, [prescriptions, searchTerm]);

  // --------------------------------------------------
  // DASHBOARD STATISTICS
  // --------------------------------------------------

  const todayCount = prescriptions.filter(
    (item) => item.prescriptionDate === getToday()
  ).length;

  const totalMedicines = prescriptions.reduce(
    (total, item) =>
      total +
      (Array.isArray(item.medicines) ? item.medicines.length : 0),
    0
  );

  // --------------------------------------------------
  // JSX
  // --------------------------------------------------

  return (
    <div className="prescription-page">

      {/* PAGE HEADER */}
      <div className="prescription-header">
        <div>
          <h2>Prescriptions</h2>
          <p>Manage patient prescriptions and medicines</p>
        </div>

        <button
          className="prescription-primary-btn"
          onClick={openAddModal}
        >
          <Plus size={18} />
          Add Prescription
        </button>
      </div>

      {/* STATISTICS */}
      <div className="prescription-stats">

        <div className="prescription-stat-card">
          <div className="prescription-stat-icon">
            <ClipboardList size={22} />
          </div>
          <div>
            <span>Total Prescriptions</span>
            <h3>{prescriptions.length}</h3>
          </div>
        </div>

        <div className="prescription-stat-card">
          <div className="prescription-stat-icon">
            <CalendarDays size={22} />
          </div>
          <div>
            <span>Today's Prescriptions</span>
            <h3>{todayCount}</h3>
          </div>
        </div>

        <div className="prescription-stat-card">
          <div className="prescription-stat-icon">
            <Pill size={22} />
          </div>
          <div>
            <span>Medicine Entries</span>
            <h3>{totalMedicines}</h3>
          </div>
        </div>

        <div className="prescription-stat-card">
          <div className="prescription-stat-icon">
            <UserRound size={22} />
          </div>
          <div>
            <span>Available Patients</span>
            <h3>{patients.length}</h3>
          </div>
        </div>

      </div>

      {/* PRESCRIPTION HISTORY */}
      <div className="prescription-content">

        <div className="prescription-section-header">
          <div>
            <h3>Prescription History</h3>
            <p>View and manage all prescriptions</p>
          </div>

          <div className="prescription-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search patient, ID or diagnosis..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="prescription-table-wrapper">
          <table className="prescription-table">
            <thead>
              <tr>
                <th>Prescription ID</th>
                <th>Patient Name</th>
                <th>Patient ID</th>
                <th>Date</th>
                <th>Diagnosis</th>
                <th>Medicines</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>

                    <td>
                      <div className="prescription-patient-cell">
                        <UserRound size={17} />
                        {item.patientName}
                      </div>
                    </td>

                    <td>{item.patientId || "Unavailable"}</td>

                    <td>{item.prescriptionDate}</td>

                    <td>{item.diagnosis}</td>

                    <td>
                      <span className="prescription-count">
                        {item.medicines?.length || 0} medicines
                      </span>
                    </td>

                    <td>
                      <div className="prescription-actions">
                        <button
                          type="button"
                          title="View"
                          onClick={() => openViewModal(item)}
                        >
                          <Eye size={17} />
                        </button>

                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEditModal(item)}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          title="Print"
                          onClick={() => printPrescription(item)}
                        >
                          <Printer size={17} />
                        </button>

                        <button
                          type="button"
                          title="Delete"
                          onClick={() => deletePrescription(item.id)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="prescription-empty">
                    <FileText size={30} />
                    <p>No prescriptions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="prescription-overlay">
          <div className="prescription-modal">

            <div className="prescription-modal-header">
              <div>
                <h3>
                  {editingId ? "Edit Prescription" : "Add Prescription"}
                </h3>
                <p>Enter patient and prescription details</p>
              </div>

              <button type="button" onClick={closeModal}>
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="prescription-form-grid">

                {/* CUSTOM PATIENT NAME DROPDOWN */}
                <div className="prescription-field prescription-patient-field">
                  <label htmlFor="prescription-patient-search">
                    Patient Name *
                  </label>

                  <div className="prescription-patient-search">
                    <div className="prescription-patient-input">
                      <Search size={17} />

                      <input
                        id="prescription-patient-search"
                        type="text"
                        value={patientSearch}
                        onChange={handlePatientSearch}
                        onFocus={() => setShowPatientDropdown(true)}
                        placeholder="Search patient name..."
                        autoComplete="off"
                        required
                      />

                      <ChevronDown size={16} />
                    </div>

                    {showPatientDropdown && (
                      <div className="prescription-patient-dropdown">

                        {filteredPatients.length > 0 ? (
                          filteredPatients.map((patient, index) => (
                            <button
                              type="button"
                              key={`${patient.patientId}-${index}`}
                              className="prescription-patient-option"
                              onClick={() => selectPatient(patient)}
                            >
                              <span className="prescription-patient-option-name">
                                <UserRound size={16} />
                                {patient.patientName}
                              </span>

                              <small>
                                {patient.patientId || "Patient ID unavailable"}
                              </small>
                            </button>
                          ))
                        ) : (
                          <div className="prescription-patient-empty">
                            No matching patients found
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                </div>

                {/* AUTOMATIC PATIENT ID */}
                <div className="prescription-field">
                  <label>Patient ID *</label>

                  <input
                    type="text"
                    name="patientId"
                    value={form.patientId}
                    placeholder="Automatically filled"
                    readOnly
                    required
                  />
                </div>

                {/* PRESCRIPTION DATE */}
                <div className="prescription-field">
                  <label>Prescription Date *</label>

                  <input
                    type="date"
                    name="prescriptionDate"
                    value={form.prescriptionDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* DIAGNOSIS */}
                <div className="prescription-field">
                  <label>Diagnosis *</label>

                  <input
                    type="text"
                    name="diagnosis"
                    value={form.diagnosis}
                    onChange={handleChange}
                    placeholder="Enter diagnosis"
                    required
                  />
                </div>

              </div>

              {/* MEDICINE SECTION */}
              <div className="prescription-medicine-section">

                <div className="prescription-medicine-header">
                  <div>
                    <h4>
                      <Pill size={18} />
                      Medicine Details
                    </h4>
                    <p>Add prescribed medicines</p>
                  </div>

                  <button
                    type="button"
                    className="prescription-add-medicine-btn"
                    onClick={addMedicine}
                  >
                    <Plus size={16} />
                    Add Medicine
                  </button>
                </div>

                {form.medicines.map((medicine, index) => (
                  <div
                    className="prescription-medicine-row"
                    key={index}
                  >
                    <div className="prescription-field">
                      <label>Medicine Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={medicine.name}
                        onChange={(event) =>
                          handleMedicineChange(index, event)
                        }
                        placeholder="Medicine name"
                      />
                    </div>

                    <div className="prescription-field">
                      <label>Dosage</label>
                      <input
                        type="text"
                        name="dosage"
                        value={medicine.dosage}
                        onChange={(event) =>
                          handleMedicineChange(index, event)
                        }
                        placeholder="e.g. 500 mg"
                      />
                    </div>

                    <div className="prescription-field">
                      <label>Frequency</label>
                      <input
                        type="text"
                        name="frequency"
                        value={medicine.frequency}
                        onChange={(event) =>
                          handleMedicineChange(index, event)
                        }
                        placeholder="e.g. 1-0-1"
                      />
                    </div>

                    <div className="prescription-field">
                      <label>Duration</label>
                      <input
                        type="text"
                        name="duration"
                        value={medicine.duration}
                        onChange={(event) =>
                          handleMedicineChange(index, event)
                        }
                        placeholder="e.g. 5 days"
                      />
                    </div>

                    <div className="prescription-field">
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="0"
                        name="quantity"
                        value={medicine.quantity}
                        onChange={(event) =>
                          handleMedicineChange(index, event)
                        }
                        placeholder="Qty"
                      />
                    </div>

                    <button
                      type="button"
                      className="prescription-remove-medicine"
                      title="Remove medicine"
                      onClick={() => removeMedicine(index)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}

              </div>

              {/* NOTES */}
              <div className="prescription-field prescription-notes">
                <label>Additional Notes</label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Enter additional instructions..."
                  rows="3"
                />
              </div>

              {/* FORM BUTTONS */}
              <div className="prescription-form-actions">
                <button
                  type="button"
                  className="prescription-cancel-btn"
                  onClick={closeModal}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="prescription-primary-btn"
                >
                  {editingId ? "Update Prescription" : "Save Prescription"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* VIEW PRESCRIPTION MODAL */}
      {viewPrescription && (
        <div
          className="prescription-overlay"
          onClick={() => setViewPrescription(null)}
        >
          <div
            className="prescription-modal prescription-view-modal"
            onClick={(event) => event.stopPropagation()}
          >

            <div className="prescription-modal-header">
              <div>
                <h3>Prescription Details</h3>
                <p>{viewPrescription.id}</p>
              </div>

              <button
                type="button"
                onClick={() => setViewPrescription(null)}
              >
                <X size={21} />
              </button>
            </div>

            <div className="prescription-view-details">

              <div>
                <span>Patient Name</span>
                <strong>{viewPrescription.patientName}</strong>
              </div>

              <div>
                <span>Patient ID</span>
                <strong>
                  {viewPrescription.patientId || "Unavailable"}
                </strong>
              </div>

              <div>
                <span>Prescription Date</span>
                <strong>{viewPrescription.prescriptionDate}</strong>
              </div>

              <div>
                <span>Diagnosis</span>
                <strong>{viewPrescription.diagnosis}</strong>
              </div>

            </div>

            <div className="prescription-view-medicines">
              <h4>
                <Pill size={18} />
                Prescribed Medicines
              </h4>

              <div className="prescription-table-wrapper">
                <table className="prescription-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(viewPrescription.medicines || []).map(
                      (medicine, index) => (
                        <tr key={index}>
                          <td>{medicine.name}</td>
                          <td>{medicine.dosage}</td>
                          <td>{medicine.frequency}</td>
                          <td>{medicine.duration}</td>
                          <td>{medicine.quantity}</td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {viewPrescription.notes && (
              <div className="prescription-view-notes">
                <h4>Additional Notes</h4>
                <p>{viewPrescription.notes}</p>
              </div>
            )}

            <div className="prescription-form-actions">
              <button
                type="button"
                className="prescription-cancel-btn"
                onClick={() => setViewPrescription(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="prescription-primary-btn"
                onClick={() => printPrescription(viewPrescription)}
              >
                <Printer size={17} />
                Print Prescription
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default Prescriptions;
