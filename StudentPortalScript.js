/* Student Grade Portal — Activity 2
   Local demo prototype. For real deployment, use a secure server and database. */
"use strict";

const seed = {
  users: [
    { id: "admin", role: "admin", name: "System Administrator", password: "admin123" },
    { id: "teacher01", role: "teacher", name: "Maria Santos", password: "teacher123", subject: "Mathematics" },
    { id: "123456789012", role: "student", name: "Juan Dela Cruz", password: "student123", lrn: "123456789012", gradeLevel: "Grade 12", section: "ICT-A" }
  ],
  students: [
    { lrn: "123456789012", name: "Juan Dela Cruz", gradeLevel: "Grade 12", section: "ICT-A", email: "juan@example.com" },
    { lrn: "123456789013", name: "Maria Garcia", gradeLevel: "Grade 12", section: "ICT-A", email: "maria@example.com" },
    { lrn: "123456789014", name: "Pedro Santos", gradeLevel: "Grade 11", section: "ICT-B", email: "pedro@example.com" }
  ],
  subjects: [
    { id: 1, name: "Mathematics", code: "MATH101", teacher: "Maria Santos", units: 3 },
    { id: 2, name: "English", code: "ENG101", teacher: "John Reyes", units: 3 },
    { id: 3, name: "Programming", code: "PROG101", teacher: "Maria Santos", units: 3 },
    { id: 4, name: "Physical Education", code: "PE101", teacher: "Ana Cruz", units: 2 }
  ],
  grades: [
    { lrn: "123456789012", subject: "Mathematics", q1: 92, q2: 94, q3: 91, q4: 95, final: 93, status: "Posted" },
    { lrn: "123456789012", subject: "English", q1: 88, q2: 90, q3: 91, q4: 92, final: 90, status: "Posted" },
    { lrn: "123456789012", subject: "Programming", q1: 95, q2: 96, q3: 94, q4: 97, final: 96, status: "Posted" },
    { lrn: "123456789012", subject: "Physical Education", q1: 90, q2: 92, q3: 93, q4: 94, final: 92, status: "Posted" },
    { lrn: "123456789013", subject: "Mathematics", q1: 85, q2: 87, q3: 88, q4: 90, final: 88, status: "Posted" }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const roleLabels = { student: "Student", teacher: "Teacher", admin: "Administrator" };
const navByRole = {
  student: [
    ["dashboard", "▦", "Dashboard"], ["grades", "▤", "My Grades"], ["profile", "♙", "My Profile"]
  ],
  teacher: [
    ["dashboard", "▦", "Dashboard"], ["grades", "✎", "Encode Grades"], ["students", "♙", "Students"], ["profile", "♙", "My Profile"]
  ],
  admin: [
    ["dashboard", "▦", "Dashboard"], ["grades", "▤", "Grade Records"], ["students", "♙", "Students"],
    ["teachers", "♧", "Teachers"], ["subjects", "▣", "Subjects"], ["profile", "♙", "My Profile"]
  ]
};

let db = loadDatabase();
let currentUser = safeParse(sessionStorage.getItem("sgp_user"));
let currentRole = "student";
let currentPage = "dashboard";
let toastTimer;

function safeParse(raw) {
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function loadDatabase() {
  const stored = safeParse(localStorage.getItem("sgp_db"));
  if (stored && Array.isArray(stored.users) && Array.isArray(stored.students) &&
      Array.isArray(stored.subjects) && Array.isArray(stored.grades)) return stored;
  const fresh = clone(seed);
  localStorage.setItem("sgp_db", JSON.stringify(fresh));
  return fresh;
}
function save() { localStorage.setItem("sgp_db", JSON.stringify(db)); }
function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 3000);
}
function avg(numbers) {
  return numbers.length ? (numbers.reduce((sum, n) => sum + Number(n || 0), 0) / numbers.length).toFixed(2) : "0.00";
}
function studentByLRN(lrn) { return db.students.find(student => student.lrn === lrn); }
function gradesFor(lrn) { return db.grades.filter(grade => grade.lrn === lrn); }
function assignedGrades() {
  if (currentUser?.role === "student") return gradesFor(currentUser.lrn || currentUser.id);
  if (currentUser?.role === "teacher") return db.grades.filter(grade => grade.subject === currentUser.subject);
  return db.grades;
}
function currentNav() { return navByRole[currentUser?.role] || []; }
function setTheme() {
  const theme = localStorage.getItem("sgp_theme") || "light";
  document.body.classList.toggle("dark", theme === "dark");
}
function showLogin() {
  $("#loginPage").classList.remove("hidden");
  $("#app").classList.add("hidden");
  $("#sidebar").classList.remove("open");
}
function showApp() {
  if (!currentUser) return showLogin();
  $("#loginPage").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#sidebar").classList.remove("open");
  $("#sidebarUserName").textContent = currentUser.name;
  $("#sidebarUserRole").textContent = roleLabels[currentUser.role] || currentUser.role;
  $("#topUserName").textContent = currentUser.name;
  $("#userAvatar").textContent = initials(currentUser.name);
  $("#topAvatar").textContent = initials(currentUser.name);
  renderNav();
  renderPage();
}
function initials(name) { return String(name || "U").trim().split(/\s+/).slice(0, 2).map(part => part[0] || "").join("").toUpperCase(); }
function renderNav() {
  $("#sideNav").innerHTML = currentNav().map(([page, icon, label]) =>
    `<button class="nav-item ${currentPage === page ? "active" : ""}" data-page="${page}" type="button"><span aria-hidden="true">${icon}</span>${label}</button>`
  ).join("");
  $$(".nav-item[data-page]").forEach(button => button.addEventListener("click", () => {
    currentPage = button.dataset.page;
    $("#sidebar").classList.remove("open");
    renderNav();
    renderPage();
  }));
}
function renderPage() {
  if (!currentUser) return showLogin();
  const titles = {
    dashboard: "Dashboard", grades: currentUser.role === "student" ? "My Grades" : currentUser.role === "teacher" ? "Encode Grades" : "Grade Records",
    students: "Students", teachers: "Teachers", subjects: "Subjects", profile: "My Profile"
  };
  $("#pageTitle").textContent = titles[currentPage] || "Dashboard";
  const renderers = { dashboard: dashboardPage, grades: gradesPage, students: studentsPage, teachers: teachersPage, subjects: subjectsPage, profile: profilePage };
  const renderer = renderers[currentPage] || dashboardPage;
  $("#pageContent").innerHTML = renderer();
  bindPage();
}
function statCard(label, value, note, icon) {
  return `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon" aria-hidden="true">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></article>`;
}
function dashboardPage() {
  if (currentUser.role === "student") {
    const grades = gradesFor(currentUser.lrn || currentUser.id);
    const posted = grades.filter(g => g.status === "Posted");
    const generalAverage = avg(posted.map(g => g.final));
    const passed = posted.filter(g => Number(g.final) >= 75).length;
    return `<div class="welcome-row"><div><h3>Welcome, ${esc(currentUser.name.split(" ")[0])} 👋</h3><p>Here is a quick look at your academic progress.</p></div><span class="status">Student account</span></div>
      <div class="stats-grid">
        ${statCard("General Average", generalAverage, "Across posted grades", "↗")}
        ${statCard("Subjects", posted.length, "With posted grades", "▤")}
        ${statCard("Passed", passed, "Subjects at 75 or above", "✓")}
        ${statCard("Your LRN", esc(currentUser.lrn || currentUser.id), `${esc(currentUser.gradeLevel || "Grade level")} · ${esc(currentUser.section || "Section")}`, "♙")}
      </div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><h3>Latest grades</h3><p>Your most recent posted subject results</p></div><button class="secondary-btn" data-go="grades" type="button">View all</button></div>
      ${grades.length ? grades.slice(-4).reverse().map(g => `<div class="grade-summary"><div><strong>${esc(g.subject)}</strong><span>${esc(g.status)} · Final grade</span></div><div class="grade-pill">${Number(g.final).toFixed(0)}</div></div>`).join("") : empty("No grades yet", "Your posted grades will appear here.")}</section>
      <section class="panel"><div class="panel-heading"><div><h3>Academic profile</h3><p>Your registered information</p></div></div><div class="quick-list">
        <div class="quick-item"><span class="stat-icon">♙</span><div><strong>${esc(currentUser.name)}</strong><span>Student name</span></div></div>
        <div class="quick-item"><span class="stat-icon">▣</span><div><strong>${esc(currentUser.gradeLevel || "Not set")}</strong><span>Grade level</span></div></div>
        <div class="quick-item"><span class="stat-icon">⌂</span><div><strong>${esc(currentUser.section || "Not set")}</strong><span>Section</span></div></div>
      </div></section></div>`;
  }
  if (currentUser.role === "teacher") {
    const grades = assignedGrades();
    const students = new Set(grades.map(g => g.lrn)).size;
    return `<div class="welcome-row"><div><h3>Welcome, ${esc(currentUser.name.split(" ")[0])} 👋</h3><p>Manage your assigned subject and student grade records.</p></div><span class="status">Teacher account</span></div>
      <div class="stats-grid">
        ${statCard("Assigned Subject", esc(currentUser.subject || "Not assigned"), "Current teaching assignment", "▤")}
        ${statCard("Grade Records", grades.length, "For your assigned subject", "✎")}
        ${statCard("Students", students, "Students with records", "♙")}
        ${statCard("Posted", grades.filter(g => g.status === "Posted").length, "Published grade records", "✓")}
      </div>
      <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><h3>Recent grade records</h3><p>Records for ${esc(currentUser.subject || "your subject")}</p></div><button class="secondary-btn" data-go="grades" type="button">Manage grades</button></div>
      ${grades.length ? grades.slice(-5).reverse().map(g => `<div class="grade-summary"><div><strong>${esc(studentByLRN(g.lrn)?.name || g.lrn)}</strong><span>${esc(g.subject)} · ${esc(g.status)}</span></div><div class="grade-pill">${Number(g.final).toFixed(0)}</div></div>`).join("") : empty("No grade records", "Add a grade record to get started.")}</section>
      <section class="panel"><div class="panel-heading"><div><h3>Quick actions</h3><p>Common tasks</p></div></div><div class="quick-list"><div class="quick-item"><span class="stat-icon">✎</span><div><strong>Encode grades</strong><span>Add or update quarterly and final grades.</span></div></div><div class="quick-item"><span class="stat-icon">♙</span><div><strong>View students</strong><span>Search students in the local demo database.</span></div></div></div></section></div>`;
  }
  return `<div class="welcome-row"><div><h3>Welcome back, Administrator</h3><p>Monitor the portal's sample academic data and records.</p></div><span class="status">Admin account</span></div>
    <div class="stats-grid">
      ${statCard("Students", db.students.length, "Student records", "♙")}
      ${statCard("Teachers", db.users.filter(u => u.role === "teacher").length, "Teacher accounts", "♧")}
      ${statCard("Subjects", db.subjects.length, "Available subjects", "▣")}
      ${statCard("Grade Records", db.grades.length, "Stored grade entries", "▤")}
    </div>
    <div class="dashboard-grid"><section class="panel"><div class="panel-heading"><div><h3>Recent grade records</h3><p>Latest entries in the database</p></div><button class="secondary-btn" data-go="grades" type="button">View records</button></div>
      ${db.grades.slice(-5).reverse().map(g => `<div class="grade-summary"><div><strong>${esc(studentByLRN(g.lrn)?.name || g.lrn)}</strong><span>${esc(g.subject)} · ${esc(g.status)}</span></div><div class="grade-pill">${Number(g.final).toFixed(0)}</div></div>`).join("") || empty("No records", "Grade records will appear here.")}</section>
      <section class="panel"><div class="panel-heading"><div><h3>Portal management</h3><p>Sample data overview</p></div></div><div class="quick-list"><div class="quick-item"><span class="stat-icon">♙</span><div><strong>Student records</strong><span>Add or update LRN, grade level, section, and email.</span></div></div><div class="quick-item"><span class="stat-icon">♧</span><div><strong>Teacher accounts</strong><span>Manage teacher accounts and subject assignments.</span></div></div><div class="quick-item"><span class="stat-icon">▣</span><div><strong>Subject catalog</strong><span>Maintain subject codes, units, and assigned teachers.</span></div></div></div></section></div>`;
}
function empty(title, message) { return `<div class="empty-state"><strong>${title}</strong>${message}</div>`; }
function tablePage(title, subtitle, buttonLabel, buttonId, tableHTML, searchPlaceholder) {
  return `<div class="toolbar"><div><h3>${title}</h3><p>${subtitle}</p></div><div class="toolbar-actions">${searchPlaceholder ? `<input id="pageSearch" class="search-input" type="search" placeholder="${searchPlaceholder}" aria-label="Search ${title.toLowerCase()}">` : ""}${buttonLabel ? `<button class="primary-btn" id="${buttonId}" type="button">＋ ${buttonLabel}</button>` : ""}</div></div><section class="panel"><div id="tableArea">${tableHTML}</div></section>`;
}
function gradesTable(grades, editable) {
  if (!grades.length) return empty("No grade records found", "Try another search or add a grade record.");
  return `<div class="table-wrap"><table><thead><tr><th>Student</th><th>LRN</th><th>Subject</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Final</th><th>Status</th>${editable ? "<th>Actions</th>" : ""}</tr></thead><tbody>${grades.map(g => {
    const originalIndex = db.grades.indexOf(g);
    return `<tr><td>${esc(studentByLRN(g.lrn)?.name || "Unknown student")}</td><td>${esc(g.lrn)}</td><td>${esc(g.subject)}</td><td>${g.q1}</td><td>${g.q2}</td><td>${g.q3}</td><td>${g.q4}</td><td><b>${g.final}</b></td><td><span class="status ${g.status === "Draft" ? "draft" : ""}">${esc(g.status)}</span></td>${editable ? `<td><div class="table-actions"><button class="small-btn edit edit-grade" data-index="${originalIndex}" type="button">Edit</button>${currentUser.role === "admin" ? `<button class="small-btn delete delete-grade" data-index="${originalIndex}" type="button">Delete</button>` : ""}</div></td>` : ""}</tr>`;
  }).join("")}</tbody></table></div>`;
}
function gradesPage() {
  if (currentUser.role === "student") {
    const grades = gradesFor(currentUser.lrn || currentUser.id);
    const average = avg(grades.filter(g => g.status === "Posted").map(g => g.final));
    return `<div class="welcome-row"><div><h3>My academic results</h3><p>View your quarterly and final grades.</p></div><span class="grade-pill">Average: ${average}</span></div><section class="panel"><div class="panel-heading"><div><h3>Grade summary</h3><p>Only records associated with your LRN are shown.</p></div></div>${gradesTable(grades, false)}</section>`;
  }
  const editable = currentUser.role === "admin" || currentUser.role === "teacher";
  const grades = assignedGrades();
  const subtitle = currentUser.role === "teacher" ? `You can manage records for ${currentUser.subject}.` : "Review, edit, or remove sample academic grade records.";
  return `${tablePage("Grade records", subtitle, "Add grade", "newGradeBtn", gradesTable(grades, editable), "Search by student LRN or subject")}`;
}
function studentsTable(students) {
  if (!students.length) return empty("No students found", "Try another search.");
  return `<div class="table-wrap"><table><thead><tr><th>LRN</th><th>Full name</th><th>Grade level</th><th>Section</th><th>Email</th>${currentUser.role === "admin" ? "<th>Actions</th>" : ""}</tr></thead><tbody>${students.map(student => {
    const index = db.students.indexOf(student);
    return `<tr><td>${esc(student.lrn)}</td><td><b>${esc(student.name)}</b></td><td>${esc(student.gradeLevel)}</td><td>${esc(student.section)}</td><td>${esc(student.email || "—")}</td>${currentUser.role === "admin" ? `<td><div class="table-actions"><button class="small-btn edit edit-student" data-index="${index}" type="button">Edit</button></div></td>` : ""}</tr>`;
  }).join("")}</tbody></table></div>`;
}
function studentsPage() {
  const canEdit = currentUser.role === "admin";
  return tablePage("Student directory", "Student names, LRN, grade level, section, and contact details.", canEdit ? "Add student" : "", "newStudentBtn", studentsTable(db.students), "Search by LRN or name");
}
function teachersTable(teachers) {
  if (!teachers.length) return empty("No teachers found", "Add a teacher account to begin.");
  return `<div class="table-wrap"><table><thead><tr><th>Username</th><th>Teacher name</th><th>Assigned subject</th><th>Account</th><th>Actions</th></tr></thead><tbody>${teachers.map(user => `<tr><td>${esc(user.id)}</td><td><b>${esc(user.name)}</b></td><td>${esc(user.subject || "Not assigned")}</td><td><span class="status">Active demo</span></td><td><button class="small-btn edit edit-teacher" data-id="${esc(user.id)}" type="button">Edit</button></td></tr>`).join("")}</tbody></table></div>`;
}
function teachersPage() {
  const teachers = db.users.filter(user => user.role === "teacher");
  return tablePage("Teacher accounts", "Manage teacher login accounts and assigned subjects.", "Add teacher", "newTeacherBtn", teachersTable(teachers), "Search by name or username");
}
function subjectsTable(subjects) {
  if (!subjects.length) return empty("No subjects found", "Add a subject to the catalog.");
  return `<div class="table-wrap"><table><thead><tr><th>Code</th><th>Subject name</th><th>Assigned teacher</th><th>Units</th><th>Actions</th></tr></thead><tbody>${subjects.map(subject => `<tr><td>${esc(subject.code)}</td><td><b>${esc(subject.name)}</b></td><td>${esc(subject.teacher)}</td><td>${subject.units}</td><td><button class="small-btn edit edit-subject" data-id="${subject.id}" type="button">Edit</button></td></tr>`).join("")}</tbody></table></div>`;
}
function subjectsPage() {
  return tablePage("Subject catalog", "Manage subject codes, unit values, and teacher assignments.", "Add subject", "newSubjectBtn", subjectsTable(db.subjects), "Search by code or subject name");
}
function profilePage() {
  const user = currentUser;
  const student = user.role === "student" ? studentByLRN(user.lrn || user.id) : null;
  const details = [
    ["Account role", roleLabels[user.role] || user.role],
    ["Login ID", user.role === "student" ? (user.lrn || user.id) : user.id],
    ...(student ? [["Grade level", student.gradeLevel], ["Section", student.section], ["Email", student.email || "Not set"]] : []),
    ...(user.role === "teacher" ? [["Assigned subject", user.subject || "Not assigned"]] : [])
  ];
  return `<div class="toolbar"><div><h3>Profile information</h3><p>Details for your current demo account.</p></div></div><div class="profile-grid"><section class="panel profile-card"><div class="avatar profile-large">${initials(user.name)}</div><h3>${esc(user.name)}</h3><p>${esc(roleLabels[user.role] || user.role)}</p><span class="status">Signed in</span></section><section class="panel"><div class="panel-heading"><div><h3>Account details</h3><p>Profile information stored in this browser.</p></div></div>${details.map(([label, value]) => `<div class="profile-detail"><span>${esc(label)}</span><strong>${esc(value || "Not set")}</strong></div>`).join("")}<p class="security-note">This prototype stores sample data in your browser's local storage.</p></section></div>`;
}
function openModal(title, description, content) {
  $("#modalRoot").innerHTML = `<div class="modal-backdrop" role="presentation"><section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-heading"><div><h3 id="modalTitle">${title}</h3><p>${description}</p></div><button class="modal-close" type="button" aria-label="Close dialog">×</button></div>${content}</section></div>`;
  const backdrop = $(".modal-backdrop");
  $(".modal-close", backdrop).addEventListener("click", closeModal);
  backdrop.addEventListener("click", event => { if (event.target === backdrop) closeModal(); });
  document.addEventListener("keydown", escModal);
  function escModal(event) { if (event.key === "Escape") { closeModal(); document.removeEventListener("keydown", escModal); } }
}
function closeModal() { $("#modalRoot").innerHTML = ""; }
function gradeModal(index = null) {
  const old = index === null ? null : db.grades[index];
  if (currentUser.role === "teacher" && old && old.subject !== currentUser.subject) return toast("You can only edit your assigned subject.");
  const grade = old || { lrn: "", subject: currentUser.role === "teacher" ? currentUser.subject : (db.subjects[0]?.name || ""), q1: 0, q2: 0, q3: 0, q4: 0, final: 0, status: "Posted" };
  const studentOptions = db.students.map(s => `<option value="${esc(s.lrn)}" ${s.lrn === grade.lrn ? "selected" : ""}>${esc(s.name)} (${esc(s.lrn)})</option>`).join("");
  const subjectList = currentUser.role === "teacher" ? db.subjects.filter(s => s.name === currentUser.subject) : db.subjects;
  const subjectOptions = subjectList.map(s => `<option value="${esc(s.name)}" ${s.name === grade.subject ? "selected" : ""}>${esc(s.name)}</option>`).join("");
  openModal(index === null ? "Add grade record" : "Edit grade record", "Enter quarterly grades and the final grade.", `<form id="gradeForm"><div class="form-grid"><div class="full-col"><label for="gradeLrn">Student / LRN</label><select id="gradeLrn" name="lrn" required>${studentOptions}</select></div><div class="full-col"><label for="gradeSubject">Subject</label><select id="gradeSubject" name="subject" required>${subjectOptions}</select></div>${["q1","q2","q3","q4","final"].map((key, i) => `<div><label for="grade_${key}">${["Quarter 1","Quarter 2","Quarter 3","Quarter 4","Final grade"][i]}</label><input id="grade_${key}" name="${key}" type="number" min="0" max="100" step="0.01" value="${Number(grade[key])}" required></div>`).join("")}<div class="full-col"><label for="gradeStatus">Status</label><select id="gradeStatus" name="status"><option ${grade.status === "Posted" ? "selected" : ""}>Posted</option><option ${grade.status === "Draft" ? "selected" : ""}>Draft</option></select></div></div><div class="modal-actions"><button class="outline-btn" type="button" id="cancelModal">Cancel</button><button class="primary-btn" type="submit">Save grade</button></div></form>`);
  $("#cancelModal").addEventListener("click", closeModal);
  $("#gradeForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lrn = String(form.get("lrn"));
    const subject = String(form.get("subject"));
    if (!studentByLRN(lrn)) return toast("LRN not found. Add the student first.");
    if (currentUser.role === "teacher" && subject !== currentUser.subject) return toast("You can only enter grades for your assigned subject.");
    const record = { lrn, subject, q1: +form.get("q1"), q2: +form.get("q2"), q3: +form.get("q3"), q4: +form.get("q4"), final: +form.get("final"), status: String(form.get("status")) };
    if (index === null) db.grades.push(record); else db.grades[index] = record;
    save(); closeModal(); renderPage(); toast("Grade saved successfully.");
  });
}
function studentModal(index = null) {
  if (currentUser.role !== "admin") return;
  const old = index === null ? null : db.students[index];
  const student = old || { lrn: "", name: "", gradeLevel: "", section: "", email: "" };
  openModal(index === null ? "Add student" : "Edit student", "Enter the student's academic information.", `<form id="studentForm"><div class="form-grid"><div class="full-col"><label for="studentLrn">LRN</label><input id="studentLrn" name="lrn" value="${esc(student.lrn)}" ${index !== null ? "readonly" : ""} required pattern="[0-9]{12}" title="Enter a 12-digit LRN"></div><div class="full-col"><label for="studentName">Full name</label><input id="studentName" name="name" value="${esc(student.name)}" required></div><div><label for="studentGrade">Grade level</label><input id="studentGrade" name="gradeLevel" value="${esc(student.gradeLevel)}" placeholder="Grade 12" required></div><div><label for="studentSection">Section</label><input id="studentSection" name="section" value="${esc(student.section)}" placeholder="ICT-A" required></div><div class="full-col"><label for="studentEmail">Email</label><input id="studentEmail" name="email" type="email" value="${esc(student.email || "")}" placeholder="student@example.com"></div></div><div class="modal-actions"><button class="outline-btn" type="button" id="cancelModal">Cancel</button><button class="primary-btn" type="submit">Save student</button></div></form>`);
  $("#cancelModal").addEventListener("click", closeModal);
  $("#studentForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = { lrn: String(form.get("lrn")).trim(), name: String(form.get("name")).trim(), gradeLevel: String(form.get("gradeLevel")).trim(), section: String(form.get("section")).trim(), email: String(form.get("email")).trim() };
    if (index === null) {
      if (db.students.some(s => s.lrn === item.lrn)) return toast("LRN already exists.");
      db.students.push(item);
      db.users.push({ id: item.lrn, role: "student", name: item.name, password: "student123", lrn: item.lrn, gradeLevel: item.gradeLevel, section: item.section });
      toast("Student added. Demo password: student123");
    } else {
      Object.assign(db.students[index], item);
      const user = db.users.find(u => u.role === "student" && (u.lrn || u.id) === item.lrn);
      if (user) Object.assign(user, { name: item.name, gradeLevel: item.gradeLevel, section: item.section });
      toast("Student updated.");
    }
    save(); closeModal(); renderPage();
  });
}
function teacherModal(id = null) {
  if (currentUser.role !== "admin") return;
  const old = id ? db.users.find(u => u.id === id && u.role === "teacher") : null;
  const teacher = old || { id: "", name: "", subject: "", password: "teacher123" };
  const subjectOptions = db.subjects.map(s => `<option value="${esc(s.name)}" ${s.name === teacher.subject ? "selected" : ""}>${esc(s.name)}</option>`).join("");
  openModal(id ? "Edit teacher" : "Add teacher", "Set the teacher login and assigned subject.", `<form id="teacherForm"><div class="form-grid"><div><label for="teacherId">Username</label><input id="teacherId" name="id" value="${esc(teacher.id)}" ${id ? "readonly" : ""} required></div><div><label for="teacherName">Full name</label><input id="teacherName" name="name" value="${esc(teacher.name)}" required></div><div class="full-col"><label for="teacherSubject">Assigned subject</label><select id="teacherSubject" name="subject"><option value="">Not assigned</option>${subjectOptions}</select></div><div class="full-col"><label for="teacherPassword">Password</label><input id="teacherPassword" name="password" value="${esc(teacher.password || "teacher123")}" required></div></div><div class="modal-actions"><button class="outline-btn" type="button" id="cancelModal">Cancel</button><button class="primary-btn" type="submit">Save teacher</button></div></form>`);
  $("#cancelModal").addEventListener("click", closeModal);
  $("#teacherForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = { id: String(form.get("id")).trim(), name: String(form.get("name")).trim(), subject: String(form.get("subject")), password: String(form.get("password")) };
    if (!id && db.users.some(u => u.id === item.id)) return toast("Username already exists.");
    if (id) Object.assign(teacher, item); else db.users.push({ ...item, role: "teacher" });
    save(); closeModal(); renderPage(); toast("Teacher saved.");
  });
}
function subjectModal(id = null) {
  if (currentUser.role !== "admin") return;
  const old = id === null ? null : db.subjects.find(s => String(s.id) === String(id));
  const subject = old || { name: "", code: "", teacher: "", units: 3 };
  const teachers = db.users.filter(u => u.role === "teacher");
  const teacherOptions = teachers.map(t => `<option value="${esc(t.name)}" ${t.name === subject.teacher ? "selected" : ""}>${esc(t.name)}</option>`).join("");
  openModal(id === null ? "Add subject" : "Edit subject", "Enter subject details and teaching assignment.", `<form id="subjectForm"><div class="form-grid"><div><label for="subjectCode">Subject code</label><input id="subjectCode" name="code" value="${esc(subject.code)}" required></div><div><label for="subjectName">Subject name</label><input id="subjectName" name="name" value="${esc(subject.name)}" required></div><div class="full-col"><label for="subjectTeacher">Teacher</label><select id="subjectTeacher" name="teacher"><option value="">Not assigned</option>${teacherOptions}</select></div><div class="full-col"><label for="subjectUnits">Units</label><input id="subjectUnits" name="units" type="number" min="1" max="6" value="${Number(subject.units) || 3}" required></div></div><div class="modal-actions"><button class="outline-btn" type="button" id="cancelModal">Cancel</button><button class="primary-btn" type="submit">Save subject</button></div></form>`);
  $("#cancelModal").addEventListener("click", closeModal);
  $("#subjectForm").addEventListener("submit", event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = { code: String(form.get("code")).trim(), name: String(form.get("name")).trim(), teacher: String(form.get("teacher")), units: Number(form.get("units")) };
    if (db.subjects.some(s => s.code.toLowerCase() === item.code.toLowerCase() && String(s.id) !== String(id))) return toast("Subject code already exists.");
    if (id !== null) Object.assign(subject, item); else db.subjects.push({ id: Date.now(), ...item });
    save(); closeModal(); renderPage(); toast("Subject saved.");
  });
}
function bindPage() {
  $$("[data-go]").forEach(button => button.addEventListener("click", () => {
    currentPage = button.dataset.go; renderNav(); renderPage();
  }));
  $("#newGradeBtn")?.addEventListener("click", () => gradeModal());
  $$(".edit-grade").forEach(button => button.addEventListener("click", () => gradeModal(Number(button.dataset.index))));
  $$(".delete-grade").forEach(button => button.addEventListener("click", () => {
    const index = Number(button.dataset.index);
    if (confirm("Delete this grade record?")) { db.grades.splice(index, 1); save(); renderPage(); toast("Grade deleted."); }
  }));
  $("#newStudentBtn")?.addEventListener("click", () => studentModal());
  $$(".edit-student").forEach(button => button.addEventListener("click", () => studentModal(Number(button.dataset.index))));
  $("#newTeacherBtn")?.addEventListener("click", () => teacherModal());
  $$(".edit-teacher").forEach(button => button.addEventListener("click", () => teacherModal(button.dataset.id)));
  $("#newSubjectBtn")?.addEventListener("click", () => subjectModal());
  $$(".edit-subject").forEach(button => button.addEventListener("click", () => subjectModal(button.dataset.id)));
  const search = $("#pageSearch");
  search?.addEventListener("input", () => {
    const query = search.value.trim().toLowerCase();
    if (currentPage === "grades") {
      const records = assignedGrades().filter(g => {
        const student = studentByLRN(g.lrn);
        return [g.lrn, g.subject, student?.name || ""].some(value => String(value).toLowerCase().includes(query));
      });
      $("#tableArea").innerHTML = gradesTable(records, currentUser.role !== "student");
      bindGradeActions();
    } else if (currentPage === "students") {
      $("#tableArea").innerHTML = studentsTable(db.students.filter(s => [s.lrn, s.name, s.gradeLevel, s.section].some(value => String(value).toLowerCase().includes(query))));
      $$(".edit-student").forEach(button => button.addEventListener("click", () => studentModal(Number(button.dataset.index))));
    } else if (currentPage === "teachers") {
      $("#tableArea").innerHTML = teachersTable(db.users.filter(u => u.role === "teacher" && [u.id, u.name, u.subject || ""].some(value => String(value).toLowerCase().includes(query))));
      $$(".edit-teacher").forEach(button => button.addEventListener("click", () => teacherModal(button.dataset.id)));
    } else if (currentPage === "subjects") {
      $("#tableArea").innerHTML = subjectsTable(db.subjects.filter(s => [s.code, s.name, s.teacher].some(value => String(value).toLowerCase().includes(query))));
      $$(".edit-subject").forEach(button => button.addEventListener("click", () => subjectModal(button.dataset.id)));
    }
  });
}
function bindGradeActions() {
  $$(".edit-grade").forEach(button => button.addEventListener("click", () => gradeModal(Number(button.dataset.index))));
  $$(".delete-grade").forEach(button => button.addEventListener("click", () => {
    const index = Number(button.dataset.index);
    if (confirm("Delete this grade record?")) { db.grades.splice(index, 1); save(); renderPage(); toast("Grade deleted."); }
  }));
}

$$(".role-tab").forEach(button => button.addEventListener("click", () => {
  currentRole = button.dataset.role;
  $$(".role-tab").forEach(tab => tab.classList.toggle("active", tab === button));
  $("#loginIdLabel").textContent = currentRole === "student" ? "LRN" : "Username";
  $("#loginId").placeholder = currentRole === "student" ? "Enter your LRN" : "Enter your username";
  $("#loginId").value = "";
  $("#loginPassword").value = "";
}));
$("#loginForm").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("#loginId").value.trim();
  const password = $("#loginPassword").value;
  const user = db.users.find(item => item.id === id && item.password === password && item.role === currentRole);
  if (!user) return toast("Invalid credentials for the selected portal.");
  currentUser = user;
  sessionStorage.setItem("sgp_user", JSON.stringify(user));
  currentPage = "dashboard";
  showApp();
  toast(`Welcome, ${user.name}!`);
});
$("#logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("sgp_user");
  currentUser = null;
  currentPage = "dashboard";
  showLogin();
  toast("You have signed out.");
});
$("#menuBtn").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#themeBtn").addEventListener("click", () => {
  const next = (localStorage.getItem("sgp_theme") || "light") === "light" ? "dark" : "light";
  localStorage.setItem("sgp_theme", next);
  setTheme();
});
setTheme();
if (currentUser && db.users.some(user => user.id === currentUser.id && user.role === currentUser.role)) showApp();
else { currentUser = null; sessionStorage.removeItem("sgp_user"); showLogin(); }
