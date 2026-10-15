# AttendEase

AttendEase is a student attendance management website for MCA Semester 1, built with HTML, CSS, and vanilla JavaScript.

## Open AttendEase

Run the project through a local web server so the browser can fetch CSV files. In VS Code, choose **Go Live** if you use the Live Server extension. Or run `python -m http.server 8000` from this folder and visit `http://localhost:8000`.

## Sign-in accounts

The sign-in page checks the username, password, and role against `data/users.csv`.

- Faculty: `faculty` / `faculty123`
- Student ICT001: `ICT001` / `student001`
- Student ICT002: `ICT002` / `student002`
- Student ICT003: `ICT003` / `student003`

These are placeholder credentials stored in a public CSV for a front-end coursework project. They are not secure. To add a student account, add a row to `data/users.csv` with username, temporary password, role `student`, student ID, and email. A production version should use server-side authentication and a database.

## Features

- Load the starter roster from `data/students.csv` with the Fetch API
- Add, remove, import, and export students
- Record attendance by subject and date as Present, Absent, or Late
- Review, filter, import, and export attendance history
- View attendance totals, subject summaries, and individual session history
- Keep roster and attendance changes in browser LocalStorage

## Subjects

- Computer Networks
- Java Programming
- Computer Organization
- Mathematics

## Project structure

- `index.html` - sign-in page
- `pages/` - Faculty and Student workspaces
- `css/` - shared, dashboard, and responsive styles
- `js/` - sign-in, storage, CSV, and page behavior
- `data/students.csv` - starter student roster
- `data/users.csv` - placeholder sign-in accounts
- `assets/logo.svg` - AttendEase mark

## Data behavior

The website reads CSV files through Fetch. Browser JavaScript cannot overwrite the project CSV file, so roster and attendance changes are saved in LocalStorage in the current browser and device. Export CSV from the Faculty workspace to download a copy. Importing CSV merges roster records by student ID or updates attendance sessions by subject and date.

