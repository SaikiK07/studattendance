/* Small CSV reader for the student starter file. Supports quoted cells and commas inside quotes. */
window.AttendEaseCsv = {
  parse(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const character = text[i];
      if (character === '"') {
        if (quoted && text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (character === "," && !quoted) {
        row.push(cell.trim());
        cell = "";
      } else if ((character === "\n" || character === "\r") && !quoted) {
        if (character === "\r" && text[i + 1] === "\n") i += 1;
        row.push(cell.trim());
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += character;
      }
    }

    row.push(cell.trim());
    if (row.some((value) => value !== "")) rows.push(row);
    if (rows.length < 2) return [];

    const headers = rows[0].map((header) => header.replace(/^\uFEFF/, "").trim().toLowerCase());
    return rows.slice(1).map((values) => Object.fromEntries(
      headers.map((header, index) => [header, values[index] || ""])
    ));
  },

  async loadStudents(csvPath) {
    const response = await fetch(csvPath);
    if (!response.ok) throw new Error(`Could not load student CSV (${response.status}).`);
    return this.parse(await response.text());
  }
};

