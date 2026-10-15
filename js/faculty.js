const facultySummary = document.querySelector("#faculty-summary");
const recentSessions = document.querySelector("#recent-sessions");
const facultyMessage = document.querySelector("#faculty-message");

function facultyCard(label, value, detail) {
  const card = document.createElement("article");
  card.className = "summary-card";
  const title = document.createElement("h3");
  title.textContent = label;
  const number = document.createElement("p");
  number.className = "summary-value";
  number.textContent = value;
  const note = document.createElement("p");
  note.className = "summary-detail";
  note.textContent = detail;
  card.append(title, number, note);
  return card;
}

function renderFacultyDashboard() {
  const students = AttendEaseStorage.getStudents();
  const sessions = AttendEaseStorage.getAttendance().sort((a, b) => b.date.localeCompare(a.date));
  const allEntries = sessions.flatMap((session) => session.entries);
  const attended = allEntries.filter((entry) => entry.status === "Present" || entry.status === "Late").length;
  const rate = allEntries.length ? Math.round((attended / allEntries.length) * 100) : 0;
  facultySummary.replaceChildren(
    facultyCard("Students", String(students.length), "Current roster"),
    facultyCard("Sessions", String(sessions.length), "Saved subject and date sessions"),
    facultyCard("Attendance rate", `${rate}%`, `${attended} of ${allEntries.length} student records attended`)
  );

  recentSessions.replaceChildren();
  sessions.slice(0, 5).forEach((session) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    title.textContent = session.subject;
    const detail = document.createElement("span");
    const present = session.entries.filter((entry) => entry.status === "Present").length;
    const late = session.entries.filter((entry) => entry.status === "Late").length;
    const absent = session.entries.filter((entry) => entry.status === "Absent").length;
    detail.textContent = `${new Date(`${session.date}T00:00:00`).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })} · ${present} present · ${late} late · ${absent} absent`;
    item.append(title, detail);
    recentSessions.append(item);
  });
  facultyMessage.textContent = sessions.length
    ? "Overview uses attendance records saved in this browser."
    : "No attendance sessions yet. Use Take attendance to record the first session.";
}

async function loadFacultyDashboard() {
  try {
    let students = AttendEaseStorage.getStudents();
    if (students.length === 0) {
      students = await AttendEaseCsv.loadStudents("../data/students.csv");
      AttendEaseStorage.saveStudents(students);
    }
    renderFacultyDashboard();
  } catch (error) {
    facultyMessage.textContent = `${error.message} Start the site with a local server, then try again.`;
    facultyMessage.classList.add("message-error");
  }
}

loadFacultyDashboard();


