/* CSV-backed sign-in for coursework. Credentials in users.csv are placeholders, not secrets. */
window.AttendEaseAuth = {
  sessionKey: "attendease.session.v1",

  getSession() {
    try { return JSON.parse(localStorage.getItem(this.sessionKey) || "null"); }
    catch { return null; }
  },

  async signIn(role, username, password) {
    const users = await AttendEaseCsv.loadStudents("data/users.csv");
    const user = users.find((item) =>
      item.role.toLowerCase() === role.toLowerCase() &&
      item.username.toLowerCase() === username.trim().toLowerCase() &&
      item.password === password
    );
    if (!user) return false;
    const session = {
      role: user.role,
      username: user.username,
      student_id: user.student_id,
      email: user.email
    };
    localStorage.setItem(this.sessionKey, JSON.stringify(session));
    localStorage.setItem("attendease.demoRole.v1", user.role);
    return true;
  },

  signOut() {
    localStorage.removeItem(this.sessionKey);
    localStorage.removeItem("attendease.activeStudent.v1");
    window.location.assign("../index.html");
  }
};

const loginForm = document.querySelector("#login-form");
if (loginForm) {
  const roleSelect = document.querySelector("#login-role");
  const usernameInput = document.querySelector("#login-username");
  const passwordInput = document.querySelector("#login-password");
  const loginMessage = document.querySelector("#login-message");
  const loginButton = document.querySelector("#login-submit");
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginButton.disabled = true;
    loginMessage.textContent = "Checking your details...";
    loginMessage.classList.remove("message-error");
    try {
      const signedIn = await window.AttendEaseAuth.signIn(roleSelect.value, usernameInput.value, passwordInput.value);
      if (!signedIn) {
        loginMessage.textContent = "Those details did not match this workspace. Check them and try again.";
        loginMessage.classList.add("message-error");
        passwordInput.focus();
        return;
      }
      window.location.assign(roleSelect.value === "faculty" ? "pages/faculty.html" : "pages/student.html");
    } catch (error) {
      loginMessage.textContent = `${error.message} Open AttendEase through a local web server and try again.`;
      loginMessage.classList.add("message-error");
    } finally {
      loginButton.disabled = false;
    }
  });
}

const requiredRole = document.body.dataset.requiredRole;
if (requiredRole) {
  const session = window.AttendEaseAuth.getSession();
  if (!session || session.role !== requiredRole) {
    window.location.replace("../index.html");
  }
}

document.querySelectorAll("[data-sign-out]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.AttendEaseAuth.signOut();
  });
});
