import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

const API_BASE_URL = "http://localhost:5050";

const FORM_CONFIG = {
  members: {
    endpoint: "members",
    primaryKey: "m_id",
    helperText: "Create, update, or remove members and admins directly from the members table.",
    fields: [
      { key: "m_id", label: "Member ID", type: "number", placeholder: "Optional if auto-generated", editable: false },
      { key: "m_name", label: "Name", type: "text", required: true, placeholder: "Full name" },
      { key: "email", label: "Email", type: "email", required: true, placeholder: "member@email.com" },
      { key: "phone", label: "Phone", type: "text", required: true, placeholder: "10-digit phone" },
      { key: "city", label: "City", type: "text", required: true, placeholder: "Pune" },
      { key: "age", label: "Age", type: "number", required: true, placeholder: "21" },
      { key: "join_date", label: "Join Date", type: "date", required: true },
      { key: "fitness_level", label: "Fitness Level", type: "select", required: true, options: ["Beginner", "Intermediate", "Advanced"] },
      { key: "role", label: "Role", type: "select", required: true, options: ["member", "admin"] },
      { key: "password", label: "Password", type: "password", required: true, placeholder: "Set login password" },
    ],
  },
  events: {
    endpoint: "events",
    primaryKey: "e_id",
    helperText: "Manage records in the event table.",
    fields: [
      { key: "e_id", label: "Event ID", type: "number", placeholder: "Optional if auto-generated", editable: false },
      { key: "e_name", label: "Event Name", type: "text", required: true, placeholder: "Sunday Long Run" },
      { key: "e_type", label: "Type", type: "select", required: true, options: ["group_run", "challenge", "special", "game"] },
      { key: "e_date", label: "Date", type: "date", required: true },
      { key: "e_time", label: "Time", type: "time", required: true },
      { key: "location", label: "Location", type: "text", required: true, placeholder: "Balewadi Stadium" },
      { key: "distance", label: "Distance (km)", type: "number", required: true, placeholder: "5" },
      { key: "max_capacity", label: "Max Capacity", type: "number", required: true, placeholder: "30" },
    ],
  },
  registrations: {
    endpoint: "registrations",
    primaryKey: "reg_id",
    helperText: "Manage registration records that connect members and events.",
    fields: [
      { key: "reg_id", label: "Registration ID", type: "number", placeholder: "Optional if auto-generated", editable: false },
      { key: "m_id", label: "Member ID", type: "number", required: true, placeholder: "Existing member ID" },
      { key: "e_id", label: "Event ID", type: "number", required: true, placeholder: "Existing event ID" },
      { key: "reg_date", label: "Registration Date", type: "date", required: true },
      { key: "reg_status", label: "Status", type: "select", required: true, options: ["registered", "cancelled"] },
    ],
  },
  attendance: {
    endpoint: "attendance",
    primaryKey: "reg_id",
    helperText: "Manage attendance rows tied to registrations.",
    fields: [
      { key: "reg_id", label: "Registration ID", type: "number", required: true, placeholder: "Existing registration ID", editable: false },
      { key: "attended", label: "Attendance", type: "select", required: true, options: [{ label: "Attended", value: "1" }, { label: "Missed", value: "0" }] },
    ],
  },
};

const TABLE_ENDPOINTS = [
  { key: "members", endpoint: "members" },
  { key: "events", endpoint: "events" },
  { key: "registrations", endpoint: "registrations" },
  { key: "attendance", endpoint: "attendance" },
  { key: "eventsummary", endpoint: "eventsummary" },
];

const CREATE_BUTTON_TABS = new Set(["members", "events", "registrations", "attendance"]);

function renderCell(row, column) {
  const value = row[column.key];

  if (column.render) {
    return column.render(value, row);
  }

  if (column.type === "pill") {
    return (
      <span className={`status-pill status-pill--${String(value).toLowerCase()}`}>
        {value}
      </span>
    );
  }

  return value;
}

function buildInitialFormState(activeTab) {
  const config = FORM_CONFIG[activeTab];

  if (!config) {
    return {};
  }

  return Object.fromEntries(config.fields.map((field) => [field.key, ""]));
}

function normalizeFormValue(field, value) {
  if (value === "") {
    return undefined;
  }

  if (field.type === "number") {
    return Number(value);
  }

  return value;
}

function rowToFormState(fields, row) {
  return Object.fromEntries(
    fields.map((field) => [field.key, row[field.key] ?? ""]),
  );
}

export default function Dashboard({ onLogout, currentAdmin }) {
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [eventSummary, setEventSummary] = useState([]);
  const [formValues, setFormValues] = useState(() => buildInitialFormState("members"));
  const [formMode, setFormMode] = useState("create");
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  async function loadDashboardData() {
    const responses = await Promise.all(
      TABLE_ENDPOINTS.map(async ({ endpoint }) => {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch ${endpoint}`);
        }

        return response.json();
      }),
    );

    setMembers(responses[0]);
    setEvents(responses[1]);
    setRegistrations(responses[2]);
    setAttendance(responses[3]);
    setEventSummary(responses[4]);
  }

  function resetForm(nextTab = activeTab) {
    setFormMode("create");
    setSelectedRecordId(null);
    setFormValues(buildInitialFormState(nextTab));
    setShowCreateForm(!CREATE_BUTTON_TABS.has(nextTab));
  }

  useEffect(() => {
    loadDashboardData().catch(() => {
      setFormError("Could not load dashboard data. Make sure the backend server is running.");
    });
  }, []);

  useEffect(() => {
    resetForm(activeTab);
    setFormError("");
    setFormSuccess("");
  }, [activeTab]);

  useEffect(() => {
    if (!formError && !formSuccess) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setFormError("");
      setFormSuccess("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [formError, formSuccess]);

  const tableConfig = {
    members: {
      title: "Members Table",
      subtitle: "Real data from MySQL members table",
      rows: members,
      columns: [
        { key: "m_id", label: "Member ID" },
        { key: "m_name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "city", label: "City" },
        { key: "age", label: "Age" },
        { key: "fitness_level", label: "Fitness Level" },
        { key: "role", label: "Role", type: "pill" },
        { key: "join_date", label: "Joined" },
      ],
    },
    events: {
      title: "Event Table",
      subtitle: "Real event data",
      rows: events,
      columns: [
        { key: "e_id", label: "Event ID" },
        { key: "e_name", label: "Event Name" },
        { key: "e_type", label: "Type", type: "pill" },
        { key: "e_date", label: "Date" },
        { key: "e_time", label: "Time" },
        { key: "location", label: "Location" },
        { key: "distance", label: "Distance", render: (value) => `${value} km` },
        { key: "max_capacity", label: "Capacity" },
      ],
    },
    registrations: {
      title: "Registration Table",
      subtitle: "Joined data",
      rows: registrations.map((registration) => {
        const member = members.find((item) => item.m_id === registration.m_id);
        const event = events.find((item) => item.e_id === registration.e_id);

        return {
          ...registration,
          member_name: member?.m_name || "Unknown",
          event_name: event?.e_name || "Unknown",
        };
      }),
      columns: [
        { key: "reg_id", label: "Registration ID" },
        { key: "member_name", label: "Member" },
        { key: "event_name", label: "Event" },
        { key: "reg_date", label: "Registered On" },
        { key: "reg_status", label: "Status", type: "pill" },
      ],
    },
    attendance: {
      title: "Attendance Table",
      subtitle: "Attendance data",
      rows: attendance.map((entry) => {
        const registration = registrations.find((item) => item.reg_id === entry.reg_id);
        const member = members.find((item) => item.m_id === registration?.m_id);
        const event = events.find((item) => item.e_id === registration?.e_id);

        return {
          ...entry,
          member_name: member?.m_name || "Unknown",
          event_name: event?.e_name || "Unknown",
          attendance_status: entry.attended ? "attended" : "missed",
        };
      }),
      columns: [
        { key: "reg_id", label: "Registration ID" },
        { key: "member_name", label: "Member" },
        { key: "event_name", label: "Event" },
        { key: "attended", label: "Raw Value" },
        { key: "attendance_status", label: "Status", type: "pill" },
      ],
    },
    eventsummary: {
      title: "Event Summary",
      subtitle: "From SQL view",
      rows: eventSummary,
      columns: [
        { key: "e_name", label: "Event Name" },
        { key: "e_date", label: "Date" },
        { key: "location", label: "Location" },
        { key: "total_registered", label: "Registered" },
        { key: "total_attended", label: "Attended" },
      ],
    },
  };

  const currentTable = tableConfig[activeTab];
  const currentFormConfig = FORM_CONFIG[activeTab];
  const canMutateCurrentTable = Boolean(currentFormConfig);
  const requiresExplicitCreate = CREATE_BUTTON_TABS.has(activeTab);
  const shouldShowForm = canMutateCurrentTable && (formMode === "edit" || !requiresExplicitCreate || showCreateForm);

  function handleFieldChange(fieldKey, value) {
    setFormValues((current) => ({
      ...current,
      [fieldKey]: value,
    }));
    setFormError("");
    setFormSuccess("");
  }

  function handleEditRecord(row) {
    if (!currentFormConfig) {
      return;
    }

    setFormMode("edit");
    setShowCreateForm(true);
    setSelectedRecordId(row[currentFormConfig.primaryKey]);
    setFormValues(rowToFormState(currentFormConfig.fields, row));
    setFormError("");
    setFormSuccess("");
  }

  async function handleDeleteRecord(row) {
    if (!currentFormConfig) {
      return;
    }

    const recordId = row[currentFormConfig.primaryKey];

    if (!window.confirm(`Delete ${activeTab} record ${recordId}? This cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      setFormError("");
      setFormSuccess("");

      const response = await fetch(`${API_BASE_URL}/${currentFormConfig.endpoint}/${recordId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || "Could not delete the record.");
        return;
      }

      await loadDashboardData();

      if (selectedRecordId === recordId) {
        resetForm(activeTab);
      }

      setFormSuccess("Record deleted successfully.");
    } catch {
      setFormError("Could not delete the record. Make sure the backend server is running.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleSubmitRecord(event) {
    event.preventDefault();

    if (!currentFormConfig) {
      return;
    }

    const missingRequiredField = currentFormConfig.fields.find((field) => {
      const isCreateOnlyIdField = formMode === "create" && field.key === currentFormConfig.primaryKey && !field.required;
      return !isCreateOnlyIdField && field.required && !String(formValues[field.key] ?? "").trim();
    });

    if (missingRequiredField) {
      setFormError(`${missingRequiredField.label} is required.`);
      return;
    }

    const payload = Object.fromEntries(
      currentFormConfig.fields
        .filter((field) => formMode === "create" || field.key !== currentFormConfig.primaryKey)
        .map((field) => [field.key, normalizeFormValue(field, formValues[field.key])])
        .filter(([, value]) => value !== undefined),
    );

    try {
      setIsSubmitting(true);
      setFormError("");
      setFormSuccess("");

      const isEdit = formMode === "edit";
      const url = isEdit
        ? `${API_BASE_URL}/${currentFormConfig.endpoint}/${selectedRecordId}`
        : `${API_BASE_URL}/${currentFormConfig.endpoint}`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setFormError(data.error || `Could not ${isEdit ? "update" : "add"} the record.`);
        return;
      }

      await loadDashboardData();
      resetForm(activeTab);
      setFormSuccess(isEdit ? "Record updated successfully." : "Record added successfully.");
    } catch {
      setFormError("Could not save the record. Make sure the backend server is running.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="admin-shell">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        currentAdmin={currentAdmin}
      />

      <main className="admin-content">
        <section className="admin-overview">
          <article className="admin-stat">
            <p className="admin-stat__label">Members</p>
            <p className="admin-stat__value">{members.length}</p>
          </article>
          <article className="admin-stat">
            <p className="admin-stat__label">Events</p>
            <p className="admin-stat__value">{events.length}</p>
          </article>
          <article className="admin-stat">
            <p className="admin-stat__label">Registrations</p>
            <p className="admin-stat__value">{registrations.length}</p>
          </article>
          <article className="admin-stat">
            <p className="admin-stat__label">Attendance Rows</p>
            <p className="admin-stat__value">{attendance.length}</p>
          </article>
        </section>

        <section className={`admin-layout ${!shouldShowForm ? "admin-layout--single" : ""}`}>
          <section className="admin-panel">
            <div className="admin-panel__header">
              <div>
                <h2 className="admin-panel__title">{currentTable.title}</h2>
                <p className="admin-panel__subtitle">{currentTable.subtitle}</p>
              </div>
              <div className="admin-panel__header-actions">
                {requiresExplicitCreate && canMutateCurrentTable && formMode === "create" && !showCreateForm && (
                  <button
                    type="button"
                    className="record-form__submit admin-panel__primary-action"
                    onClick={() => {
                      setShowCreateForm(true);
                      setFormError("");
                      setFormSuccess("");
                    }}
                  >
                    {activeTab === "members"
                      ? "Add New Member"
                      : activeTab === "events"
                        ? "Add New Event"
                        : activeTab === "registrations"
                          ? "Add New Registration"
                          : "Add New Attendance"}
                  </button>
                )}
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    {currentTable.columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                    {canMutateCurrentTable && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentTable.rows.map((row, index) => (
                    <tr
                      key={
                        row.id ??
                        row.reg_id ??
                        row.m_id ??
                        row.e_id ??
                        `${activeTab}-${index}`
                      }
                    >
                      {currentTable.columns.map((column) => (
                        <td key={column.key}>{renderCell(row, column)}</td>
                      ))}
                      {canMutateCurrentTable && (
                        <td>
                          <div className="table-actions">
                            <button
                              type="button"
                              className="table-action table-action--edit"
                              onClick={() => handleEditRecord(row)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="table-action table-action--delete"
                              onClick={() => handleDeleteRecord(row)}
                              disabled={isDeleting}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {shouldShowForm ? (
          <aside className="admin-panel admin-panel--form">
            <div className="admin-panel__header admin-panel__header--stacked">
              <div>
                <h2 className="admin-panel__title">
                  {canMutateCurrentTable
                    ? formMode === "edit" ? "Edit Record" : "Add New Record"
                    : "Read-Only View"}
                </h2>
                <p className="admin-panel__subtitle">
                  {currentFormConfig
                    ? currentFormConfig.helperText
                    : "This tab is read-only because it comes from a SQL view."}
                </p>
              </div>
              {canMutateCurrentTable && (
                <button type="button" className="record-form__reset" onClick={() => resetForm(activeTab)}>
                  {formMode === "edit" ? "Cancel editing" : "Close form"}
                </button>
              )}
            </div>

            {currentFormConfig ? (
              <form className="record-form" onSubmit={handleSubmitRecord}>
                <div className="record-form__grid">
                  {currentFormConfig.fields.map((field) => {
                    const isReadOnly = formMode === "edit" && field.editable === false;

                    return (
                      <label key={field.key} className="record-form__field">
                        <span>{field.label}</span>
                        {field.type === "select" ? (
                          <select
                            value={formValues[field.key] ?? ""}
                            onChange={(event) => handleFieldChange(field.key, event.target.value)}
                            required={field.required}
                            disabled={isReadOnly}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options.map((option) => {
                              const normalizedOption = typeof option === "string"
                                ? { label: option, value: option }
                                : option;

                              return (
                                <option key={normalizedOption.value} value={normalizedOption.value}>
                                  {normalizedOption.label}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={formValues[field.key] ?? ""}
                            placeholder={field.placeholder}
                            onChange={(event) => handleFieldChange(field.key, event.target.value)}
                            required={field.required && !(formMode === "create" && field.key === currentFormConfig.primaryKey && !field.required)}
                            readOnly={isReadOnly}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>

                {formError && <p className="record-form__message record-form__message--error">{formError}</p>}
                {formSuccess && <p className="record-form__message record-form__message--success">{formSuccess}</p>}

                <div className="record-form__actions">
                  <button type="submit" className="record-form__submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : formMode === "edit" ? `Update ${activeTab}` : `Add to ${activeTab}`}
                  </button>
                  {formMode === "edit" && (
                    <button type="button" className="record-form__secondary" onClick={() => resetForm(activeTab)}>
                      Back to add mode
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="record-form__empty">
                <p>New rows cannot be added here because `eventsummary` is a derived database view.</p>
              </div>
            )}
          </aside>
          ) : null}
        </section>
      </main>
    </div>
  );
}
