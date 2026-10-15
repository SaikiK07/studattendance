const subjectInput = document.querySelector("#attendance-subject");
const dateInput = document.querySelector("#attendance-date");
const roster = document.querySelector("#attendance-roster");
const attendanceMessage = document.querySelector("#attendance-message");
const attendanceForm = document.querySelector("#attendance-form");
const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
dateInput.value = localDate;

function showAttendanceMessage(message, isError = false) {
  attendanceMessage.textContent = message;
  attendanceMessage.classList.toggle("message-error", isError);
}

function createStudentRow(student, savedStatus = "Present") {
  const row = document.createElement("div");
  row.className = "attendance-row";
  const details = document.createElement("div");
  details.className = "attendance-student";
  const name = document.createElement("strong");
  name.textContent = student.name;
  const id = document.createElement("span");
  id.textContent = student.student_id;
  details.append(name, id);

  const label = document.createElement("label");
  label.className = "status-field";
  const labelText = document.createElement("span");
  labelText.textContent = "Status";
  const select = document.createElement("select");
  select.name = `status-${student.student_id}`;
  select.dataset.studentId = student.student_id;
  ["Present", "Absent", "Late"].forEach((status) => {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    option.selected = status === savedStatus;
    select.append(option);
  });
  label.append(labelText, select);
  row.append(details, label);
  return row;
}

function renderRoster(students, savedEntries = []) {
  roster.replaceChildren();
  if (students.length === 0) {
    showAttendanceMessage("No students found. Add students on the Manage Students page first.", true);
    return;
  }
  students.forEach((student) => {
    const savedEntry = savedEntries.find((entry) => entry.student_id === student.student_id);
    roster.append(createStudentRow(student, savedEntry?.status || "Present"));
  });
  showAttendanceMessage(`${students.length} students ready. Choose a status for each student.`);
}

async function loadAttendanceRoster() {
  showAttendanceMessage("Loading student list...");
  try {
    let students = AttendEaseStorage.getStudents();
    if (students.length === 0) {
      students = await AttendEaseCsv.loadStudents("../data/students.csv");
      AttendEaseStorage.saveStudents(students);
    }
    renderRoster(students);
  } catch (error) {
    showAttendanceMessage(`${error.message} Start the site with a local server, then try again.`, true);
  }
}

function loadSavedSession() {
  const record = AttendEaseStorage.getAttendance().find((item) =>
    item.date === dateInput.value && item.subject === subjectInput.value
  );
  let students = AttendEaseStorage.getStudents();
  if (record) {
    roster.replaceChildren();
    students.forEach((student) => {
      const entry = record.entries.find((item) => item.student_id === student.student_id);
      roster.append(createStudentRow(student, entry?.status || "Present"));
    });
    showAttendanceMessage("A saved session exists for this subject and date. You can review or update it.");
  } else {
    renderRoster(students);
  }
}

attendanceForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entries = Array.from(roster.querySelectorAll("select[data-student-id]"), (select) => ({
    student_id: select.dataset.studentId,
    status: select.value
  }));
  if (entries.length === 0) {
    showAttendanceMessage("There are no students to save.", true);
    return;
  }

  const records = AttendEaseStorage.getAttendance();
  const session = {
    date: dateInput.value,
    subject: subjectInput.value,
    entries,
    updated_at: new Date().toISOString()
  };
  const existingIndex = records.findIndex((item) =>
    item.date === session.date && item.subject === session.subject
  );
  if (existingIndex >= 0) records[existingIndex] = session;
  else records.push(session);
  AttendEaseStorage.saveAttendance(records);
  showAttendanceMessage(`Attendance saved for ${entries.length} students on ${session.date}.`);
});

subjectInput.addEventListener("change", loadSavedSession);
dateInput.addEventListener("change", loadSavedSession);
loadAttendanceRoster();
