const historyTableBody = document.querySelector("#history-table-body");
const historyMessage = document.querySelector("#history-message");
const subjectFilter = document.querySelector("#history-subject");
const exportButton = document.querySelector("#export-history");
const importInput = document.querySelector("#import-history");
const statuses = ["Present", "Absent", "Late"];

function showHistoryMessage(message, isError = false) {
  historyMessage.textContent = message;
  historyMessage.classList.toggle("message-error", isError);
}

function formatDate(date) {
  if (!date) return "";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric"
  });
}

function renderHistory() {
  const records = AttendEaseStorage.getAttendance()
    .filter((record) => !subjectFilter.value || record.subject === subjectFilter.value)
    .sort((a, b) => b.date.localeCompare(a.date) || a.subject.localeCompare(b.subject));
  historyTableBody.replaceChildren();

  records.forEach((record, index) => {
    const row = document.createElement("tr");
    const count = (status) => record.entries.filter((entry) => entry.status === status).length;
    [formatDate(record.date), record.subject, record.entries.length, count("Present"), count("Absent"), count("Late")].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    const actionCell = document.createElement("td");
    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "text-button detail-toggle";
    viewButton.textContent = "Details";
    viewButton.setAttribute("aria-expanded", "false");
    viewButton.setAttribute("aria-controls", `details-${index}`);
    const detailRow = document.createElement("tr");
    detailRow.id = `details-${index}`;
    detailRow.hidden = true;
    const detailCell = document.createElement("td");
    detailCell.colSpan = 7;
    const detailList = document.createElement("ul");
    detailList.className = "history-details";
    const students = AttendEaseStorage.getStudents();
    record.entries.forEach((entry) => {
      const listItem = document.createElement("li");
      const student = students.find((item) => item.student_id === entry.student_id);
      listItem.textContent = `${student?.name || entry.student_id} (${entry.student_id}) - ${entry.status}`;
      detailList.append(listItem);
    });
    detailCell.append(detailList);
    detailRow.append(detailCell);
    viewButton.addEventListener("click", () => {
      detailRow.hidden = !detailRow.hidden;
      viewButton.setAttribute("aria-expanded", String(!detailRow.hidden));
      viewButton.textContent = detailRow.hidden ? "Details" : "Hide";
    });
    actionCell.append(viewButton);
    row.append(actionCell);
    historyTableBody.append(row, detailRow);
  });

  showHistoryMessage(records.length
    ? `Showing ${records.length} saved ${records.length === 1 ? "session" : "sessions"}.`
    : "No attendance sessions found. Take attendance first, or import an AttendEase CSV file.");
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function exportHistory() {
  const students = AttendEaseStorage.getStudents();
  const records = AttendEaseStorage.getAttendance()
    .filter((record) => !subjectFilter.value || record.subject === subjectFilter.value);
  if (!records.length) {
    showHistoryMessage("There are no sessions to export.", true);
    return;
  }
  const lines = [["date", "subject", "student_id", "student_name", "status"].map(csvCell).join(",")];
  records.forEach((record) => record.entries.forEach((entry) => {
    const student = students.find((item) => item.student_id === entry.student_id);
    lines.push([record.date, record.subject, entry.student_id, student?.name || "", entry.status].map(csvCell).join(","));
  }));
  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "attendease-attendance.csv";
  link.click();
  URL.revokeObjectURL(url);
  showHistoryMessage("Attendance CSV exported.");
}

async function importHistory(file) {
  try {
    const rows = AttendEaseCsv.parse(await file.text());
    const required = ["date", "subject", "student_id", "status"];
    if (!rows.length || required.some((key) => !(key in rows[0]))) {
      throw new Error("CSV headers must include date, subject, student_id, and status.");
    }

    const validSubjects = Array.from(subjectFilter.options).map((option) => option.value).filter(Boolean);
    const sessions = new Map();
    rows.forEach((row) => {
      const date = row.date.trim();
      const subject = row.subject.trim();
      const studentId = row.student_id.trim();
      const status = statuses.find((item) => item.toLowerCase() === row.status.trim().toLowerCase());
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !validSubjects.includes(subject) || !studentId || !status) {
        throw new Error("Each row needs a valid date, subject, student ID, and Present / Absent / Late status.");
      }
      const key = `${date}|${subject}`;
      if (!sessions.has(key)) sessions.set(key, { date, subject, entries: [] });
      const session = sessions.get(key);
      const existing = session.entries.find((entry) => entry.student_id === studentId);
      if (existing) existing.status = status;
      else session.entries.push({ student_id: studentId, status });
    });

    const records = AttendEaseStorage.getAttendance();
    sessions.forEach((session) => {
      session.updated_at = new Date().toISOString();
      const index = records.findIndex((record) => record.date === session.date && record.subject === session.subject);
      if (index >= 0) records[index] = session;
      else records.push(session);
    });
    AttendEaseStorage.saveAttendance(records);
    renderHistory();
    showHistoryMessage(`Imported ${sessions.size} attendance ${sessions.size === 1 ? "session" : "sessions"}.`);
  } catch (error) {
    showHistoryMessage(error.message, true);
  } finally {
    importInput.value = "";
  }
}

subjectFilter.addEventListener("change", renderHistory);
exportButton.addEventListener("click", exportHistory);
importInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importHistory(file);
});
renderHistory();
