/* ============================================
   app.js – MediBook Frontend Logic
   ============================================ */

// ===== AUTH CHECK =====
(function() {
  const currentPath = window.location.pathname;
  // Protect all pages except login.html
  if (!currentPath.includes('login.html')) {
    const token = localStorage.getItem('medibook_token');
    if (!token) {
      window.location.replace('login.html');
    }
  }
})();

// ===== THEME (runs instantly, before DOM paints) =====
(function() {
  const saved = localStorage.getItem('medibook_theme');
  if (saved === 'light') document.documentElement.classList.add('light-init');
})();

// ===== DOCTORS DATA =====
const DOCTORS = [
  { id: 1, name: "Dr. Priya Sharma",    spec: "Cardiologist",    exp: "12 yrs", rating: 4.9, fee: 800,  seed: "doc1",  available: true  },
  { id: 2, name: "Dr. Arjun Mehta",     spec: "Neurologist",     exp: "9 yrs",  rating: 4.8, fee: 900,  seed: "doc2",  available: true  },
  { id: 3, name: "Dr. Swati Rao",       spec: "Pediatrician",    exp: "15 yrs", rating: 4.9, fee: 700,  seed: "doc3",  available: true  },
  { id: 4, name: "Dr. Rohit Verma",     spec: "Orthopedist",     exp: "11 yrs", rating: 4.7, fee: 850,  seed: "doc4",  available: false },
  { id: 5, name: "Dr. Nisha Gupta",     spec: "Dermatologist",   exp: "8 yrs",  rating: 4.8, fee: 750,  seed: "doc5",  available: true  },
  { id: 6, name: "Dr. Kiran Patel",     spec: "Gynecologist",    exp: "14 yrs", rating: 4.9, fee: 950,  seed: "doc6",  available: true  },
  { id: 7, name: "Dr. Sanjay Kumar",    spec: "Ophthalmologist", exp: "10 yrs", rating: 4.6, fee: 700,  seed: "doc7",  available: true  },
  { id: 8, name: "Dr. Anjali Singh",    spec: "Psychiatrist",    exp: "7 yrs",  rating: 4.8, fee: 1000, seed: "doc8",  available: true  },
  { id: 9, name: "Dr. Ravi Iyer",       spec: "ENT Specialist",  exp: "13 yrs", rating: 4.7, fee: 800,  seed: "doc9",  available: true  },
  { id: 10, name: "Dr. Meena Pillai",   spec: "Dentist",         exp: "6 yrs",  rating: 4.5, fee: 650,  seed: "doc10", available: true  },
];

const COLORS = ['b6e3f4', 'ffdfbf', 'd1fae5', 'ffd5dc', 'e0e7ff', 'fef3c7', 'f3e8ff', 'd1fae5', 'fce7f3', 'e0f2fe'];
const TIME_SLOTS = ["9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM","12:00 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM"];
const BOOKED_SLOTS = [2, 5, 9]; // indices of already booked slots (for demonstration)

// ===== STATE =====
let state = {
  step: 1, // 1=choose doctor, 2=choose slot, 3=patient info
  selectedDoctor: null,
  selectedDate: null,
  selectedSlot: null,
  appointments: [],
};

// ===== UTILITY =====
function avatarUrl(seed, color) {
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}&backgroundColor=${color}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' }).format(date);
}

function getNext7Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

function generateId() {
  return 'MB' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function saveAppointments() {
  localStorage.setItem('medibook_appointments', JSON.stringify(state.appointments));
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', info: 'ℹ️', error: '❌' };
  toast.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}

// ===== NAVBAR =====
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  const themeBtn = document.getElementById('themeToggle');

  // Apply saved theme immediately
  if (localStorage.getItem('medibook_theme') === 'light') {
    document.body.classList.add('light');
  }

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    // Close menu when link is clicked on mobile
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isLight = document.body.classList.toggle('light');
      localStorage.setItem('medibook_theme', isLight ? 'light' : 'dark');
    });
  }
}

// ===== SCROLL ANIMATIONS =====
function initAOS() {
  const elements = document.querySelectorAll('[data-aos]');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  elements.forEach(el => observer.observe(el));
}

// ===== HOME PAGE =====
function initHomePage() {
  const grid = document.getElementById('doctorsGrid');
  if (!grid) return;

  const featured = DOCTORS.slice(0, 4);
  grid.innerHTML = featured.map((doc, i) => `
    <div class="doctor-card" onclick="window.location='book.html?doctor=${doc.id}'">
      <div style="position:relative;display:inline-block">
        <div class="doctor-avatar">
          <img src="${avatarUrl(doc.seed, COLORS[i])}" alt="${doc.name}" loading="lazy" />
        </div>
        ${doc.available ? '<div class="doctor-available"></div>' : ''}
      </div>
      <div class="doctor-name">${doc.name}</div>
      <div class="doctor-spec">${doc.spec}</div>
      <div class="doctor-meta">
        <span>⭐ ${doc.rating}</span>
        <span>🩺 ${doc.exp}</span>
        <span>₹${doc.fee}</span>
      </div>
      <a href="book.html?doctor=${doc.id}" class="btn btn-primary btn-sm doctor-book-btn">Book Now</a>
    </div>
  `).join('');
}

// ===== BOOKING PAGE =====
function initBookPage() {
  if (!document.getElementById('doctorsList')) return;

  // Read URL params
  const params = new URLSearchParams(window.location.search);
  const preDoc  = parseInt(params.get('doctor'));
  const preSpec = params.get('specialty');

  renderDoctorsList(DOCTORS, preDoc, preSpec);
  renderDatePicker();
  renderSummary();
  initFilters(preSpec);
}

function initFilters(preSpec) {
  const search   = document.getElementById('searchInput');
  const specSel  = document.getElementById('specFilter');
  const availCk  = document.getElementById('availFilter');

  if (preSpec && specSel) specSel.value = preSpec;

  function applyFilters() {
    const q    = search ? search.value.toLowerCase() : '';
    const spec = specSel ? specSel.value : '';
    const avail = availCk ? availCk.checked : false;

    const filtered = DOCTORS.filter(d => {
      if (q && !d.name.toLowerCase().includes(q) && !d.spec.toLowerCase().includes(q)) return false;
      if (spec && !d.spec.toLowerCase().includes(spec.toLowerCase())) return false;
      if (avail && !d.available) return false;
      return true;
    });
    renderDoctorsList(filtered);
  }

  if (search)  search.addEventListener('input', applyFilters);
  if (specSel) specSel.addEventListener('change', applyFilters);
  if (availCk) availCk.addEventListener('change', applyFilters);
}

function renderDoctorsList(doctors, preSelectId, preSpec) {
  const list = document.getElementById('doctorsList');
  if (!list) return;

  if (!doctors.length) {
    list.innerHTML = `<div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="1.5"/></svg>
      <p>No doctors found matching your filters.</p>
    </div>`;
    return;
  }

  list.innerHTML = doctors.map((doc, i) => `
    <div class="doctor-list-card ${preSelectId === doc.id || (preSpec && doc.spec.toLowerCase().includes(preSpec.toLowerCase()) && i === 0) ? 'selected' : ''}"
         id="dlc-${doc.id}" onclick="selectDoctor(${doc.id})">
      <div class="dlc-avatar">
        <img src="${avatarUrl(doc.seed, COLORS[doc.id - 1] || 'b6e3f4')}" alt="${doc.name}" loading="lazy" />
      </div>
      <div class="dlc-info">
        <div class="dlc-name">${doc.name}</div>
        <div class="dlc-spec">${doc.spec}</div>
        <div class="dlc-meta">
          <span>⭐ ${doc.rating}</span>
          <span>🩺 ${doc.exp} exp</span>
          <span>₹${doc.fee} / visit</span>
        </div>
      </div>
      <div class="dlc-actions">
        ${doc.available ? '<span class="badge-available">● Available</span>' : '<span class="badge-available" style="color:#ef4444;border-color:rgba(239,68,68,.25);background:rgba(239,68,68,.09)">Unavailable</span>'}
        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();selectDoctor(${doc.id})">Select</button>
      </div>
    </div>
  `).join('');

  // Auto-select if preselected
  const autoSelect = preSelectId ? preSelectId : (preSpec ? doctors[0]?.id : null);
  if (autoSelect) setTimeout(() => selectDoctor(autoSelect), 100);
}

function selectDoctor(id) {
  state.selectedDoctor = DOCTORS.find(d => d.id === id);
  document.querySelectorAll('.doctor-list-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById(`dlc-${id}`);
  if (card) { card.classList.add('selected'); card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  renderSummary();
  // Scroll to slot section
  const slotSec = document.getElementById('slotSection');
  if (slotSec) slotSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderDatePicker() {
  const row = document.getElementById('datePicker');
  if (!row) return;
  const days = getNext7Days();
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  row.innerHTML = days.map((d, i) => `
    <div class="date-chip ${i === 0 ? 'selected' : ''}" id="datechip-${i}"
         onclick="selectDate(${i}, '${d.toISOString()}')">
      <span class="day">${dayNames[d.getDay()]}</span>
      <span class="num">${d.getDate()}</span>
      <span class="month">${monthNames[d.getMonth()]}</span>
    </div>
  `).join('');

  // Select today by default
  selectDate(0, days[0].toISOString());
}

function selectDate(idx, iso) {
  state.selectedDate = new Date(iso);
  state.selectedSlot = null;
  document.querySelectorAll('.date-chip').forEach((c, i) => c.classList.toggle('selected', i === idx));
  renderTimeSlots();
  renderSummary();
}

function renderTimeSlots() {
  const grid = document.getElementById('slotsGrid');
  if (!grid) return;
  grid.innerHTML = TIME_SLOTS.map((slot, i) => `
    <div class="time-slot ${BOOKED_SLOTS.includes(i) ? 'booked' : ''}"
         id="slot-${i}" onclick="selectSlot(${i}, '${slot}')">
      ${slot}
    </div>
  `).join('');
}

function selectSlot(idx, label) {
  state.selectedSlot = label;
  document.querySelectorAll('.time-slot').forEach((s, i) => s.classList.toggle('selected', i === idx));
  renderSummary();
}

function renderSummary() {
  const nameEl  = document.getElementById('sumDoctor');
  const specEl  = document.getElementById('sumSpec');
  const dateEl  = document.getElementById('sumDate');
  const slotEl  = document.getElementById('sumSlot');
  const feeEl   = document.getElementById('sumFee');
  const btnEl   = document.getElementById('confirmBtn');

  if (nameEl) {
    if (state.selectedDoctor) {
      nameEl.textContent = state.selectedDoctor.name;
      nameEl.className = 'bs-value';
    } else {
      nameEl.textContent = 'Not selected';
      nameEl.className = 'bs-value empty';
    }
  }
  if (specEl && state.selectedDoctor) specEl.textContent = state.selectedDoctor.spec;
  if (dateEl) {
    if (state.selectedDate) {
      dateEl.textContent = formatDate(state.selectedDate);
      dateEl.className = 'bs-value';
    } else {
      dateEl.textContent = 'Not selected';
      dateEl.className = 'bs-value empty';
    }
  }
  if (slotEl) {
    if (state.selectedSlot) {
      slotEl.textContent = state.selectedSlot;
      slotEl.className = 'bs-value';
    } else {
      slotEl.textContent = 'Not selected';
      slotEl.className = 'bs-value empty';
    }
  }
  if (feeEl && state.selectedDoctor) feeEl.textContent = `₹${state.selectedDoctor.fee}`;
  if (btnEl) btnEl.disabled = !(state.selectedDoctor && state.selectedDate && state.selectedSlot);
}

function goToBookingForm() {
  if (!state.selectedDoctor || !state.selectedDate || !state.selectedSlot) {
    showToast('Please select a doctor, date, and time slot!', 'error');
    return;
  }
  document.getElementById('bookingFormSection').classList.remove('hidden');
  document.getElementById('bookingFormSection').scrollIntoView({ behavior: 'smooth' });
}

async function submitBooking(e) {
  e.preventDefault();
  const form = e.target;
  const name  = form.querySelector('#patName').value.trim();
  const phone = form.querySelector('#patPhone').value.trim();
  const email = form.querySelector('#patEmail').value.trim();
  const reason = form.querySelector('#patReason').value.trim();
  const age   = form.querySelector('#patAge').value.trim();

  if (!name || !phone || !email) { showToast('Please fill in required fields.', 'error'); return; }

  const apptPayload = {
    doctorId: state.selectedDoctor.id,
    doctorName: state.selectedDoctor.name,
    doctorSpec: state.selectedDoctor.spec,
    date: state.selectedDate.toISOString(),
    slot: state.selectedSlot,
    fee: state.selectedDoctor.fee,
    patient: { name, phone, email, age, reason },
  };

  const btn = form.querySelector('button[type="submit"]');
  btn.innerHTML = 'Booking...';
  btn.disabled = true;

  try {
    const token = localStorage.getItem('medibook_token');
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(apptPayload)
    });
    
    if (res.status === 401) {
      showToast('Please login to book an appointment', 'error');
      setTimeout(() => window.location.href = 'login.html', 1500);
      return;
    }
    
    const savedAppt = await res.json();
    state.appointments.push(savedAppt);
    
    sessionStorage.setItem('lastAppt', JSON.stringify(savedAppt));
    window.location.href = 'confirm.html';
  } catch(err) {
    showToast('Failed to book. Try again.', 'error');
    btn.innerHTML = 'Confirm Appointment';
    btn.disabled = false;
  }
}

// ===== CONFIRMATION PAGE =====
function initConfirmPage() {
  const container = document.getElementById('confirmContainer');
  if (!container) return;

  const appt = JSON.parse(sessionStorage.getItem('lastAppt') || 'null');
  if (!appt) { container.innerHTML = '<p style="color:var(--text-muted);text-align:center">No appointment found. <a href="index.html" style="color:var(--primary-light)">Go Home</a></p>'; return; }

  const date = new Date(appt.date);
  document.getElementById('cApptId').textContent  = appt.id;
  document.getElementById('cDoctor').textContent  = appt.doctorName;
  document.getElementById('cSpec').textContent    = appt.doctorSpec;
  document.getElementById('cDate').textContent    = formatDate(date);
  document.getElementById('cSlot').textContent    = appt.slot;
  document.getElementById('cPatient').textContent = appt.patient.name;
  document.getElementById('cFee').textContent     = `₹${appt.fee}`;
}

// ===== DASHBOARD =====
async function initDashboard() {
  if (!document.getElementById('dashAppointments')) return;

  const token = localStorage.getItem('medibook_token');
  if (!token) {
    document.getElementById('dashAppointments').innerHTML = '<p style="text-align:center;padding:40px;">Please <a href="login.html" style="color:var(--primary-light)">log in</a> to view your appointments.</p>';
    return;
  }

  try {
    const res = await fetch('/api/appointments', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if(!res.ok) throw new Error('Auth failed');
    state.appointments = await res.json();
  } catch(err) {
    localStorage.removeItem('medibook_token');
    window.location.href = 'login.html';
    return;
  }

  const all   = state.appointments;
  const now   = new Date();
  const upcoming   = all.filter(a => new Date(a.date) >= now && a.status !== 'cancelled');
  const completed  = all.filter(a => a.status === 'completed' || new Date(a.date) < now);
  const cancelled  = all.filter(a => a.status === 'cancelled');

  // Update stats
  setText('statTotal',     all.length);
  setText('statUpcoming',  upcoming.length);
  setText('statCompleted', completed.length);
  setText('statCancelled', cancelled.length);

  renderDashAppointments(all);
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function renderDashAppointments(appointments) {
  const container = document.getElementById('dashAppointments');
  if (!container) return;

  if (!appointments.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        <p>No appointments yet.</p>
        <a href="book.html" class="btn btn-primary">Book Your First Appointment</a>
      </div>`;
    return;
  }

  const sorted = [...appointments].sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt));

  container.innerHTML = sorted.map(appt => {
    const d = new Date(appt.date);
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const isPast = d < new Date();
    const status = appt.status === 'cancelled' ? 'cancelled' : (isPast ? 'completed' : 'upcoming');

    return `
    <div class="appointment-item" id="appt-${appt.id}">
      <div class="appt-date-block">
        <div class="appt-day">${d.getDate()}</div>
        <div class="appt-month">${months[d.getMonth()]}</div>
      </div>
      <div class="appt-info">
        <div class="appt-doctor">${appt.doctorName}</div>
        <div class="appt-spec">${appt.doctorSpec}</div>
        <div class="appt-time">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          ${appt.slot} &nbsp;·&nbsp; ID: ${appt._id}
        </div>
      </div>
      <div class="appt-actions">
        <span class="appt-status status-${status}">${status}</span>
        ${status === 'upcoming' ? `
          <button class="btn btn-sm btn-outline" onclick="rescheduleAppt('${appt._id}')">Reschedule</button>
          <button class="btn btn-sm btn-danger" onclick="cancelAppt('${appt._id}')">Cancel</button>
        ` : ''}
      </div>
    </div>`;
  }).join('');
}

async function cancelAppt(id) {
  const appt = state.appointments.find(a => (a._id || a.id) === id);
  if (!appt) return;
  if (!confirm(`Cancel appointment with ${appt.doctorName} on ${formatDate(new Date(appt.date))}?`)) return;
  
  try {
    const token = localStorage.getItem('medibook_token');
    const res = await fetch(`/api/appointments/${id}/cancel`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if(res.ok) {
      appt.status = 'cancelled';
      showToast('Appointment cancelled successfully.', 'info');
      renderDashAppointments(state.appointments);
      initDashboard();
    }
  } catch(err) {
    showToast('Failed to cancel appointment', 'error');
  }
}

function rescheduleAppt(id) {
  window.location.href = `book.html?reschedule=${id}`;
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAOS();
  initHomePage();
  initBookPage();
  initConfirmPage();
  initDashboard();

  // Booking form submit
  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) bookingForm.addEventListener('submit', submitBooking);

  // Confirm btn
  const confirmBtn = document.getElementById('confirmBtn');
  if (confirmBtn) confirmBtn.addEventListener('click', goToBookingForm);

  // Removed dummy data generator since we run on DB now.
  initDashboard();
});
