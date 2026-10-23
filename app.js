// ============================================================
// WORK IMMERSION APP (app.js) - Final
// ============================================================

const API_URL = '/api/proxy';
let currentStudent = null;
let diaryImagesBase64 = [];

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  const saved = localStorage.getItem('wi_student');
  if (saved) {
    try { currentStudent = JSON.parse(saved); showDashboard(); } catch (e) { localStorage.removeItem('wi_student'); }
  }
});

function startClock() {
  setInterval(() => {
    const now = new Date();
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const el = document.getElementById('current-datetime');
    if (el) el.innerText = now.toLocaleDateString('en-PH', options);
  }, 1000);
}

async function callAPI(action, payload = {}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    });
    return await res.json();
  } catch (err) { return { success: false, error: 'Network error.' }; }
}

// ============================================================
// AUTHENTICATION
// ============================================================

function goToTeacher() { window.location.href = 'teacher.html'; }

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
  if (tab === 'login') { document.getElementById('login-form').classList.add('active'); document.getElementById('tab-login').classList.add('active'); }
  else { document.getElementById('signup-form').classList.add('active'); document.getElementById('tab-signup').classList.add('active'); }
}

async function handleLogin(e) {
  e.preventDefault();
  const lrn = document.getElementById('login-lrn').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');
  
  if (!lrn || !password) { errorEl.innerText = 'Enter both fields.'; return; }
  errorEl.innerText = 'Logging in...';
  
  const res = await callAPI('login', { lrn: String(lrn), password: String(password) });
  
  if (res.success && res.student) {
    currentStudent = res.student;
    localStorage.setItem('wi_student', JSON.stringify(currentStudent));
    errorEl.innerText = '';
    showDashboard();
  } else { errorEl.innerText = res.error || 'Login failed.'; }
}

async function handleSignup(e) {
  e.preventDefault();
  const lrn = document.getElementById('signup-lrn').value.trim();
  const lastName = document.getElementById('signup-lastname').value.trim();
  const firstName = document.getElementById('signup-firstname').value.trim();
  const middleName = document.getElementById('signup-middlename').value.trim();
  const password = document.getElementById('signup-password').value;
  const sex = document.getElementById('signup-sex').value;
  const section = document.getElementById('signup-section').value;
  const field = document.getElementById('signup-field').value;
  const course = document.getElementById('signup-course').value;
  const deploymentArea = document.getElementById('signup-area').value;
  const schoolName = document.getElementById('signup-school').value;
  
  const errorEl = document.getElementById('signup-error');
  if (!lrn || !password || !lastName || !firstName || !sex || !section) { errorEl.innerText = 'Fill all required fields.'; return; }

  errorEl.innerText = 'Creating account...';
  const res = await callAPI('signup', { lrn, lastName, firstName, middleName, password, field, course, deploymentArea, schoolName, sex, section });
  
  if (res.success) {
    alert('Signup successful! Please log in.');
    switchAuthTab('login');
    document.getElementById('login-lrn').value = lrn;
  } else { errorEl.innerText = res.error || 'Signup failed.'; }
}

function logout() {
  currentStudent = null; localStorage.removeItem('wi_student');
  document.getElementById('dashboard-screen').classList.remove('active');
  document.getElementById('auth-screen').classList.add('active');
  document.getElementById('login-form').reset();
}

// ============================================================
// DASHBOARD
// ============================================================

function showDashboard() {
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('dashboard-screen').classList.add('active');
  document.getElementById('student-name').innerText = `${currentStudent.firstName} ${currentStudent.lastName}`;
  switchDashTab('time');
  loadAnnouncement();
  loadAttendance();
  loadDiary();
  loadRequirements();
}

function switchDashTab(tabName) {
  document.querySelectorAll('.dash-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.dashboard-tabs .tab').forEach(t => t.classList.remove('active'));
  const target = document.getElementById(`dash-${tabName}`);
  if (target) target.classList.add('active');
  document.querySelectorAll('.dashboard-tabs .tab').forEach(t => { if (t.getAttribute('onclick').includes(tabName)) t.classList.add('active'); });
}

// ============================================================
// DYNAMIC DROPDOWNS
// ============================================================

const courseData = {
  'Health': { courses: ['Nursing', 'Medical Technology', 'Pharmacy'], areas: { 'Nursing': ['RHU San Jose', 'Lying-In Clinic', 'LGU San Jose'], 'Medical Technology': ['RHU San Jose', 'LGU San Jose'], 'Pharmacy': ['LGU San Jose', 'SHEBA'] } },
  'Education': { courses: ['BSEd', 'BEEd'], areas: { 'BSEd': ['School', 'LGU San Jose'], 'BEEd': ['School', 'LGU San Jose'] } },
  'Agriculture': { courses: ['BS Agriculture'], areas: { 'BS Agriculture': ['Department of Agriculture', 'LGU San Jose', 'SHEBA'] } },
  'Business': { courses: ['Accountancy', 'Business Admin'], areas: { 'Accountancy': ['LGU San Jose', 'Papay\'s Bakeshop'], 'Business Admin': ['LGU San Jose', 'Papay\'s Bakeshop', 'SHEBA'] } },
  'Engineering/IT': { courses: ['Civil Engineering', 'IT'], areas: { 'Civil Engineering': ['LGU San Jose', 'SHEBA'], 'IT': ['LGU San Jose', 'SHEBA'] } }
};

function updateCourses() {
  const field = document.getElementById('signup-field').value;
  const courseSelect = document.getElementById('signup-course');
  const areaSelect = document.getElementById('signup-area');
  courseSelect.innerHTML = '<option value="">Select Course</option>';
  areaSelect.innerHTML = '<option value="">Select Course First</option>';
  document.getElementById('school-group').style.display = 'none';
  if (field && courseData[field]) {
    courseData[field].courses.forEach(c => { const opt = document.createElement('option'); opt.value = c; opt.innerText = c; courseSelect.appendChild(opt); });
  }
  courseSelect.onchange = updateAreas;
}

function updateAreas() {
  const field = document.getElementById('signup-field').value;
  const course = document.getElementById('signup-course').value;
  const areaSelect = document.getElementById('signup-area');
  const schoolGroup = document.getElementById('school-group');
  areaSelect.innerHTML = '<option value="">Select Area</option>';
  schoolGroup.style.display = 'none';
  if (field && course && courseData[field].areas[course]) {
    courseData[field].areas[course].forEach(a => { const opt = document.createElement('option'); opt.value = a; opt.innerText = a; areaSelect.appendChild(opt); });
  }
  areaSelect.onchange = () => { schoolGroup.style.display = (areaSelect.value === 'School') ? 'flex' : 'none'; };
}

// ============================================================
// TIME IN / OUT & ATTENDANCE
// ============================================================

async function timeIn() {
  const res = await callAPI('timeIn', { lrn: currentStudent.lrn });
  if (res.success) { alert(`Time In: ${res.timeIn}`); loadAttendance(); } else { alert(res.error); }
}

async function timeOut() {
  const res = await callAPI('timeOut', { lrn: currentStudent.lrn });
  if (res.success) { alert(`Time Out: ${res.timeOut}\nTotal: ${res.totalHours}`); loadAttendance(); } else { alert(res.error); }
}

async function loadAttendance() {
  const res = await callAPI('getAttendance', { lrn: currentStudent.lrn });
  const list = document.getElementById('attendance-list');
  list.innerHTML = '';
  let total = 0;
  if (res.success && res.records) {
    res.records.reverse().forEach(r => {
      total += parseFloat(r.totalHours) || 0;
      const li = document.createElement('li');
      li.innerHTML = `<span>${r.date}</span> <span>${r.timeIn || '-'} to ${r.timeOut || '-'}</span> <strong>${r.totalHours || 0} hrs</strong>`;
      list.appendChild(li);
    });
  }
  document.getElementById('total-hours').innerText = total.toFixed(2) + ' hrs';
}

// ============================================================
// DIARY
// ============================================================

function previewDiaryImages(e) {
  const files = Array.from(e.target.files);
  const preview = document.getElementById('diary-preview');
  preview.innerHTML = '';
  diaryImagesBase64 = [];
  if (files.length < 2) { alert('Select at least 2 pictures.'); return; }
  
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        canvas.width = MAX_WIDTH; canvas.height = img.height * (MAX_WIDTH / img.width);
        const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        diaryImagesBase64.push(compressedDataUrl.split(',')[1]);
        const previewImg = document.createElement('img'); previewImg.src = compressedDataUrl; preview.appendChild(previewImg);
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function saveDiary() {
  const day = document.getElementById('diary-day').value;
  const text = document.getElementById('diary-text').value;
  if (!day || !text || diaryImagesBase64.length < 2) { alert('Fill Day, Text, and 2 images.'); return; }
  
  const btn = event.target; btn.innerText = 'Saving...'; btn.disabled = true;
  let uploadedUrls = [];
  for (let i = 0; i < diaryImagesBase64.length; i++) {
    const res = await callAPI('uploadFile', { lrn: currentStudent.lrn, fileName: `Diary_Day${day}_Img${i+1}.jpg`, mimeType: 'image/jpeg', base64Data: diaryImagesBase64[i], fileType: 'diary' });
    if (res.success) uploadedUrls.push(res.fileUrl);
  }
  const res = await callAPI('saveDiary', { lrn: currentStudent.lrn, dayNumber: day, entryText: text, imageUrls: uploadedUrls });
  btn.innerText = 'Save Diary Entry'; btn.disabled = false;
  
  if (res.success) {
    alert('Diary saved!'); document.getElementById('diary-text').value = ''; diaryImagesBase64 = [];
    document.getElementById('diary-preview').innerHTML = ''; document.getElementById('diary-images').value = '';
    loadDiary();
  } else { alert(res.error); }
}

async function loadDiary() {
  const res = await callAPI('getDiary', { lrn: currentStudent.lrn });
  const scoreRes = await callAPI('getScores', { lrn: currentStudent.lrn });
  const list = document.getElementById('diary-list');
  list.innerHTML = '';
  
  const scoresMap = {};
  if (scoreRes.success && scoreRes.scores) scoreRes.scores.forEach(s => scoresMap[s.dayNumber] = s);

  if (res.success && res.entries) {
    res.entries.sort((a, b) => a.dayNumber - b.dayNumber).forEach(entry => {
      const li = document.createElement('li');
      let scoreHtml = '<span style="color: gray; font-size: 12px;">(Not graded yet)</span>';
      if (scoresMap[entry.dayNumber]) scoreHtml = `<span style="color: #34c759; font-weight: bold;">Score: ${scoresMap[entry.dayNumber].score}/20</span>`;
      li.innerHTML = `<div><strong>Day ${entry.dayNumber}:</strong> ${entry.entryText.substring(0, 30)}...</div> ${scoreHtml}`;
      list.appendChild(li);
    });
  }
}

// ============================================================
// REQUIREMENTS & WORD DOC
// ============================================================

function validatePDF(e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.type !== 'application/pdf') { alert('PDF only!'); e.target.value = ''; return; }
  if (file.size > 5 * 1024 * 1024) { alert('Max 5MB only.'); e.target.value = ''; return; }
}

async function uploadRequirement() {
  const fileInput = document.getElementById('req-file');
  const file = fileInput.files[0];
  if (!file) { alert('Select a PDF first.'); return; }
  const btn = event.target; btn.innerText = 'Uploading...'; btn.disabled = true;
  
  const reader = new FileReader();
  reader.onload = async (evt) => {
    const base64Data = evt.target.result.split(',')[1];
    const res = await callAPI('uploadFile', { lrn: currentStudent.lrn, fileName: file.name, mimeType: 'application/pdf', base64Data, fileType: 'requirement' });
    btn.innerText = 'Upload PDF'; btn.disabled = false;
    if (res.success) { alert('Uploaded!'); fileInput.value = ''; loadRequirements(); } else { alert(res.error); }
  };
  reader.readAsDataURL(file);
}

async function loadRequirements() {
  const res = await callAPI('getRequirements', { lrn: currentStudent.lrn });
  const list = document.getElementById('requirements-list');
  list.innerHTML = '';
  if (res.success && res.files) {
    res.files.forEach(f => { const li = document.createElement('li'); li.innerHTML = `<a href="${f.fileUrl}" target="_blank">${f.fileName}</a>`; list.appendChild(li); });
  }
}

async function generateWordDoc() {
  const res = await callAPI('getDiary', { lrn: currentStudent.lrn });
  if (!res.success || !res.entries || res.entries.length === 0) { alert('No entries found.'); return; }
  
  let html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body style="font-family: Arial;">`;
  html += `<h1 style="text-align:center;">DAILY DIARY</h1><h3>Name: ${currentStudent.firstName} ${currentStudent.lastName}</h3><h3>LRN: ${currentStudent.lrn}</h3><hr>`;
  res.entries.sort((a, b) => a.dayNumber - b.dayNumber).forEach(entry => { html += `<h4>Day ${entry.dayNumber} - ${entry.date}</h4><p>${entry.entryText}</p><hr>`; });
  html += `</body></html>`;
  
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `Diary_${currentStudent.lastName}.doc`; a.click(); URL.revokeObjectURL(url);
}

// ============================================================
// ANNOUNCEMENTS & PROFILE
// ============================================================

async function loadAnnouncement() {
  const res = await callAPI('getAnnouncement');
  if (res.success && res.announcement) {
    document.getElementById('student-announcement').classList.add('active');
    document.getElementById('announcement-text').innerText = res.announcement;
  } else { document.getElementById('student-announcement').classList.remove('active'); }
}

function showProfileModal() {
  document.getElementById('edit-supervisor').value = currentStudent.supervisor || '';
  document.getElementById('profile-modal').classList.add('active');
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.remove('active');
}

async function saveProfile() {
  const supervisor = document.getElementById('edit-supervisor').value.trim();
  const res = await callAPI('updateProfile', { lrn: currentStudent.lrn, supervisor });
  if (res.success) {
    currentStudent.supervisor = supervisor;
    localStorage.setItem('wi_student', JSON.stringify(currentStudent));
    alert('Profile updated!');
    closeProfileModal();
  } else { alert(res.error); }
}
