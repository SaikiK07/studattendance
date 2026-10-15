/* LocalStorage keeps this demo's data in the current browser on this device. */
window.AttendEaseStorage = {
  studentsKey: "attendease.students.v1",
  attendanceKey: "attendease.attendance.v1",
  activeStudentKey: "attendease.activeStudent.v1",

  getStudents() {
    return JSON.parse(localStorage.getItem(this.studentsKey) || "[]");
  },

  saveStudents(students) {
    localStorage.setItem(this.studentsKey, JSON.stringify(students));
  },

  getAttendance() {
    return JSON.parse(localStorage.getItem(this.attendanceKey) || "[]");
  },

  saveAttendance(records) {
    localStorage.setItem(this.attendanceKey, JSON.stringify(records));
  },

  getActiveStudentId() {
    return localStorage.getItem(this.activeStudentKey) || "";
  },

  saveActiveStudentId(studentId) {
    localStorage.setItem(this.activeStudentKey, studentId);
  },

  clearStudents() {
    localStorage.removeItem(this.studentsKey);
  }
};
