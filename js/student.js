const studentPicker = document.querySelector("#student-picker");
const studentMessage = document.querySelector("#student-message");
const studentDashboard = document.querySelector("#student-dashboard");
const studentWelcome = document.querySelector("#student-welcome");
const summaryCards = document.querySelector("#attendance-summary");
const historyBody = document.querySelector("#student-history-body");
const subjectSummaryBody = document.querySelector("#student-subject-summary");
const subjects = ["Computer Networks", "Java Programming", "Computer Organization", "Mathematics"];

function showStudentMessage(message, isError = false) {
  studentMessage.textContent = message;
  studentMessage.classList.toggle("message-error", isError);
}

function makeSummaryCard(label, value, detail) {
  const card = document.createElement("article");
  card.className = "summary-card";
  const heading = document.createElement("h3");
  heading.textContent = label;
  const amount = document.createElement("p");
  amount.className = "summary-value";
  amount.textContent = value;
  const note = document.createElement("p");
  note.className = "summary-detail";
  note.textContent = detail;
  card.append(heading, amount, note);
  return card;
}

function renderStudentDashboard(studentId) {
  const student = AttendEaseStorage.getStudents().find((item) => item.student_id === studentId);
  if (!student) {
    studentDashboard.hidden = true;
    showStudentMessage("Choose a student from the list to view their demo dashboard.");
    return;
  }
  AttendEaseStorage.saveActiveStudentId(studentId);
  studentWelcome.textContent = `${student.name} · ${student.student_id}`;
  const records = AttendEaseStorage.getAttendance()
    .filter((record) => record.entries.some((entry) => entry.student_id === studentId))
    .sort((a, b) => b.date.localeCompare(a.date) || a.subject.localeCompare(b.subject));
  const entries = records.map((record) => ({
    date: record.date,
    subject: record.subject,
    status: record.entries.find((entry) => entry.student_id === studentId).status
  }));
  const present = entries.filter((entry) => entry.status === "Present").length;
  const absent = entries.filter((entry) => entry.status === "Absent").length;
  const late = entries.filter((entry) => entry.status === "Late").length;
  const attended = present + late;
  const rate = entries.length ? Math.round((attended / entries.length) * 100) : 0;

  summaryCards.replaceChildren(
    makeSummaryCard("Attendance rate", `${rate}%`, `${attended} of ${entries.length} recorded sessions attended`),
    makeSummaryCard("Present", String(present), "Sessions marked present"),
    makeSummaryCard("Late", String(late), "Sessions marked late"),
    makeSummaryCard("Absent", String(absent), "Sessions marked absent")
  );
  subjectSummaryBody.replaceChildren();
  subjects.forEach((subject) => {
    const subjectEntries = entries.filter((entry) => entry.subject === subject);
    const subjectAttended = subjectEntries.filter((entry) => entry.status === "Present" || entry.status === "Late").length;
    const subjectRate = subjectEntries.length ? `${Math.round((subjectAttended / subjectEntries.length) * 100)}%` : "—";
    const row = document.createElement("tr");
    [subject, subjectEntries.length, subjectAttended, subjectRate].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    subjectSummaryBody.append(row);
  });
  historyBody.replaceChildren();
  entries.forEach((entry) => {
    const row = document.createElement("tr");
    [new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }), entry.subject, entry.status].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    historyBody.append(row);
  });
  studentDashboard.hidden = false;
  showStudentMessage(entries.length ? "Your attendance summary is up to date." : "No attendance records are available for you yet.");
}

async function loadStudentOptions() {
  showStudentMessage("Loading student list...");
  try {
    const session = AttendEaseAuth.getSession();
    let students = AttendEaseStorage.getStudents();
    if (session?.role === "student") students = students.filter((student) => student.student_id === session.student_id);
    if (students.length === 0) {
      students = await AttendEaseCsv.loadStudents("../data/students.csv");
      AttendEaseStorage.saveStudents(students);
    }
    studentPicker.replaceChildren();
    const prompt = document.createElement("option");
    prompt.value = "";
    prompt.textContent = "Choose a student";
    studentPicker.append(prompt);
    students.forEach((student) => {
      const option = document.createElement("option");
      option.value = student.student_id;
      option.textContent = `${student.name} (${student.student_id})`;
      studentPicker.append(option);
    });
    studentPicker.disabled = session?.role === "student";
    const savedId = session?.student_id || AttendEaseStorage.getActiveStudentId();
    const selectedId = students.some((student) => student.student_id === savedId) ? savedId : "";
    studentPicker.value = selectedId;
    if (selectedId) renderStudentDashboard(selectedId);
    else {
      studentDashboard.hidden = true;
      showStudentMessage("Choose a student to view their attendance dashboard.");
    }
  } catch (error) {
    showStudentMessage(`${error.message} Start the site with a local server, then try again.`, true);
  }
}

studentPicker.addEventListener("change", () => {
  if (studentPicker.value) renderStudentDashboard(studentPicker.value);
  else {
    AttendEaseStorage.saveActiveStudentId("");
    studentDashboard.hidden = true;
    showStudentMessage("Choose a student to view their attendance dashboard.");
  }
});
loadStudentOptions();



