const studentTableBody = document.querySelector("#student-table-body");
const studentCount = document.querySelector("#student-count");
const studentMessage = document.querySelector("#student-message");
const reloadStudentsButton = document.querySelector("#reload-students");
const studentForm = document.querySelector("#student-form");
const studentIdInput = document.querySelector("#student-id");
const studentNameInput = document.querySelector("#student-name");
const studentEmailInput = document.querySelector("#student-email");
const exportStudentsButton = document.querySelector("#export-students");
const importStudentsInput = document.querySelector("#import-students");
let students = [];

function showMessage(message, isError = false) {
  studentMessage.textContent = message;
  studentMessage.classList.toggle("message-error", isError);
}

function renderStudents() {
  studentTableBody.replaceChildren();
  students.forEach((student) => {
    const row = document.createElement("tr");
    [student.student_id, student.name, student.email, student.role].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    const actionCell = document.createElement("td");
    const removeButton = document.createElement("button");
    removeButton.className = "text-button";
    removeButton.type = "button";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", `Remove ${student.name}`);
    removeButton.addEventListener("click", () => removeStudent(student.student_id));
    actionCell.append(removeButton);
    row.append(actionCell);
    studentTableBody.append(row);
  });
  studentCount.textContent = `${students.length} ${students.length === 1 ? "student" : "students"}`;
}

function saveAndRender(message) {
  AttendEaseStorage.saveStudents(students);
  renderStudents();
  showMessage(message);
}

function addStudent(event) {
  event.preventDefault();
  const student = {
    student_id: studentIdInput.value.trim(),
    name: studentNameInput.value.trim(),
    email: studentEmailInput.value.trim(),
    role: "student"
  };
  if (students.some((item) => item.student_id.toLowerCase() === student.student_id.toLowerCase())) {
    showMessage("That student ID is already in use. Choose another ID.", true);
    studentIdInput.focus();
    return;
  }
  students.push(student);
  saveAndRender(`${student.name} was added and saved in this browser.`);
  studentForm.reset();
  studentIdInput.focus();
}

function removeStudent(studentId) {
  const student = students.find((item) => item.student_id === studentId);
  students = students.filter((item) => item.student_id !== studentId);
  saveAndRender(`${student.name} was removed from this browser's student list.`);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename, lines) {
  const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportStudents() {
  const lines = [["student_id", "name", "email", "role"].map(csvCell).join(",")];
  students.forEach((student) => lines.push([student.student_id, student.name, student.email, student.role].map(csvCell).join(",")));
  downloadCsv("attendease-students.csv", lines);
  showMessage("Student roster exported as CSV.");
}

async function importStudents(file) {
  try {
    const imported = AttendEaseCsv.parse(await file.text());
    const required = ["student_id", "name", "email"];
    if (!imported.length || required.some((key) => !(key in imported[0]))) {
      throw new Error("CSV headers must include student_id, name, and email.");
    }
    const seen = new Set();
    const prepared = imported.map((row, index) => {
      const student = {
        student_id: row.student_id.trim(),
        name: row.name.trim(),
        email: row.email.trim(),
        role: (row.role || "student").trim() || "student"
      };
      const key = student.student_id.toLowerCase();
      if (!student.student_id || !student.name || !student.email.includes("@")) {
        throw new Error(`Row ${index + 2} needs a student ID, name, and valid email.`);
      }
      if (seen.has(key)) throw new Error(`Student ID ${student.student_id} appears more than once in the CSV.`);
      seen.add(key);
      return student;
    });

    let added = 0;
    let updated = 0;
    prepared.forEach((student) => {
      const existingIndex = students.findIndex((item) => item.student_id.toLowerCase() === student.student_id.toLowerCase());
      if (existingIndex >= 0) {
        students[existingIndex] = student;
        updated += 1;
      } else {
        students.push(student);
        added += 1;
      }
    });
    saveAndRender(`Roster import complete: ${added} added, ${updated} updated.`);
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    importStudentsInput.value = "";
  }
}

async function loadStudentList() {
  showMessage("Loading students...");
  try {
    students = AttendEaseStorage.getStudents();
    if (students.length === 0) {
      students = await AttendEaseCsv.loadStudents("../data/students.csv");
      AttendEaseStorage.saveStudents(students);
    }
    renderStudents();
    showMessage("Student list loaded. Changes are saved in this browser.");
  } catch (error) {
    showMessage(`${error.message} Start the site with a local server, then try again.`, true);
  }
}

studentForm.addEventListener("submit", addStudent);
exportStudentsButton.addEventListener("click", exportStudents);
importStudentsInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importStudents(file);
});
reloadStudentsButton.addEventListener("click", async () => {
  AttendEaseStorage.clearStudents();
  await loadStudentList();
});
loadStudentList();
