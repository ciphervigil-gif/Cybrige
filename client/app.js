// Frontend logic for Cybrige Solutions (multi-page)

const API_BASE = window.location.origin.replace(/\/+$/, '') + '/api';

// State
let authToken = null;
let currentUser = null;

// Shared elements
const navLinks = document.querySelectorAll('.nav-link');
const navToggle = document.querySelector('.nav-toggle');
const navLinksContainer = document.querySelector('.nav-links');
const yearEl = document.getElementById('year');

const authModal = document.getElementById('authModal');
const openAuthModalBtn = document.getElementById('openAuthModalBtn');
const heroAuthBtn = document.getElementById('heroAuthBtn');
const footerAuthBtn = document.getElementById('footerAuthBtn');
const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
const modalTabs = document.querySelectorAll('.modal-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const loginMessage = document.getElementById('loginMessage');
const signupMessage = document.getElementById('signupMessage');

// Page-specific elements (may be null depending on page)
const coursesGrid = document.getElementById('coursesGrid');
const verifyForm = document.getElementById('verifyForm');
const verifyResult = document.getElementById('verifyResult');
const contactForm = document.getElementById('contactForm');

const dashboardSection = document.getElementById('dashboard');
const dashboardUser = document.getElementById('dashboardUser');
const dashboardCourses = document.getElementById('dashboardCourses');
const logoutBtn = document.getElementById('logoutBtn');
const playerHint = document.getElementById('playerHint');
const playerMeta = document.getElementById('playerMeta');
const videoPlayer = document.getElementById('videoPlayer');

// Determine current page for active nav state
function getCurrentPageKey() {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith('about.html')) return 'about';
  if (path.endsWith('training.html')) return 'training';
  if (path.endsWith('verify.html')) return 'verify';
  if (path.endsWith('contact.html')) return 'contact';
  // default to home (index.html or /)
  return 'home';
}

function setActiveNavByPage() {
  const pageKey = getCurrentPageKey();
  navLinks.forEach((link) => {
    const key = link.dataset.page;
    link.classList.toggle('active', key === pageKey);
  });
}

// Auth helpers
function openAuthModal(initialTab = 'login') {
  if (!authModal) return;
  authModal.classList.add('open');
  switchTab(initialTab);
}

function closeAuthModal() {
  if (!authModal) return;
  authModal.classList.remove('open');
}

function switchTab(tab) {
  modalTabs.forEach((t) => {
    const isActive = t.dataset.tab === tab;
    t.classList.toggle('active', isActive);
  });
  if (loginForm && signupForm) {
    loginForm.classList.toggle('hidden', tab !== 'login');
    signupForm.classList.toggle('hidden', tab !== 'signup');
  }
  if (loginMessage) {
    loginMessage.textContent = '';
    loginMessage.className = 'form-message';
  }
  if (signupMessage) {
    signupMessage.textContent = '';
    signupMessage.className = 'form-message';
  }
}

function saveAuth(token, user) {
  authToken = token;
  currentUser = user;
  localStorage.setItem('cybrigeAuth', JSON.stringify({ token, user }));
  updateDashboardVisibility();
}

function loadAuth() {
  try {
    const raw = localStorage.getItem('cybrigeAuth');
    if (!raw) return;
    const parsed = JSON.parse(raw);
    authToken = parsed.token;
    currentUser = parsed.user;
    updateDashboardVisibility();
  } catch (e) {
    console.warn('Failed to load auth from storage', e);
  }
}

function clearAuth() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('cybrigeAuth');
  updateDashboardVisibility();
}

function updateDashboardVisibility() {
  if (!dashboardSection || !dashboardUser || !dashboardCourses || !playerMeta || !playerHint || !videoPlayer) {
    return;
  }

  if (currentUser && authToken) {
    dashboardSection.classList.remove('hidden');
    dashboardUser.textContent = `Logged in as ${currentUser.fullName} (${currentUser.email})`;
    loadDashboardCourses();
  } else {
    dashboardSection.classList.add('hidden');
    dashboardCourses.innerHTML = '';
    playerMeta.innerHTML = '';
    playerHint.textContent = 'Choose a module to begin watching. Access is restricted to authenticated students.';
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
  }
}

async function apiRequest(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => ({})) : {};
  if (!res.ok) {
    const message = data.message || 'Request failed';
    throw new Error(message);
  }
  return data;
}

// Courses and dashboard
async function loadCourses() {
  if (!coursesGrid) return;
  try {
    const courses = await apiRequest('/courses', { method: 'GET' });
    if (!Array.isArray(courses)) return;

    coursesGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();

    courses.forEach((course) => {
      let badgeLabel = 'Popular';
      if (course.level && /beginner/i.test(course.level)) {
        badgeLabel = 'Beginner Friendly';
      } else if (course.level && /advanced/i.test(course.level)) {
        badgeLabel = 'Advanced';
      }

      const card = document.createElement('article');
      card.className = 'glass-card course-card';
      card.innerHTML = `
        <div class="course-badge">${badgeLabel}</div>
        <div class="course-chip">Cyber Training</div>
        <h3>${course.title}</h3>
        <div class="course-meta">
          <span>${course.duration}</span>
          <span class="course-level">${course.level || 'Beginner'}</span>
        </div>
        <p class="course-description">${course.description}</p>
        <div class="course-actions">
          <button class="btn btn-primary btn-enroll" data-slug="${course.slug}">Enroll</button>
          <button class="btn btn-ghost btn-details" data-slug="${course.slug}">View Details</button>
        </div>
      `;
      fragment.appendChild(card);
    });

    coursesGrid.appendChild(fragment);

    coursesGrid.addEventListener('click', (e) => {
      const enrollBtn = e.target.closest('.btn-enroll');
      const detailsBtn = e.target.closest('.btn-details');
      if (enrollBtn) {
        if (!currentUser) {
          openAuthModal('signup');
        } else if (dashboardSection) {
          dashboardSection.scrollIntoView({ behavior: 'smooth' });
        }
      } else if (detailsBtn) {
        const slug = detailsBtn.dataset.slug;
        if (slug) {
          loadCourseModulesInDashboard(slug);
          if (dashboardSection) {
            dashboardSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });
  } catch (err) {
    console.error('Failed to load courses', err);
    // Error handling removed per user request
  }
}

async function loadDashboardCourses() {
  if (!dashboardCourses) return;
  try {
    const courses = await apiRequest('/courses', { method: 'GET' });
    dashboardCourses.innerHTML = '';
    const fragment = document.createDocumentFragment();

    courses.forEach((c) => {
      const row = document.createElement('div');
      row.className = 'course-row';
      row.dataset.slug = c.slug;
      row.innerHTML = `
        <div>
          <div class="course-row-title">${c.title}</div>
          <div class="course-row-meta">${c.duration} • ${c.level || 'Beginner'}</div>
        </div>
        <button class="btn btn-outline btn-small">Open</button>
      `;
      fragment.appendChild(row);
    });

    dashboardCourses.appendChild(fragment);

    dashboardCourses.addEventListener('click', (e) => {
      const row = e.target.closest('.course-row');
      if (!row) return;
      const slug = row.dataset.slug;
      if (slug) {
        loadCourseModulesInDashboard(slug);
      }
    });
  } catch (err) {
    console.error('Failed to load dashboard courses', err);
  }
}

async function loadCourseModulesInDashboard(slug) {
  if (!currentUser) {
    openAuthModal('login');
    return;
  }
  if (!playerMeta || !playerHint) return;
  try {
    const data = await apiRequest(`/courses/${slug}/modules`, { method: 'GET' });
    const { course, modules } = data;
    if (!course || !Array.isArray(modules)) return;

    playerMeta.innerHTML = `
      <div><strong>${course.title}</strong> • ${course.duration}</div>
      <div class="small-text">Select a module to start the secure video stream.</div>
    `;

    const moduleList = document.createElement('div');
    moduleList.className = 'module-list';
    modules.forEach((m) => {
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'module-pill';
      pill.textContent = `${m.order || m.index + 1}. ${m.title}`;
      pill.dataset.endpoint = m.videoEndpoint;
      pill.addEventListener('click', () => {
        moduleList.querySelectorAll('.module-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        loadVideo(m.videoEndpoint, `${course.title} – ${m.title}`);
      });
      moduleList.appendChild(pill);
    });

    const oldList = playerMeta.querySelector('.module-list');
    if (oldList) {
      oldList.remove();
    }
    playerMeta.appendChild(moduleList);
    playerHint.textContent = '';
  } catch (err) {
    console.error('Failed to load modules', err);
    playerMeta.innerHTML = `<p class="form-message error">Unable to load modules: ${err.message}</p>`;
  }
}

function loadVideo(endpoint) {
  if (!videoPlayer) return;
  const url = `${API_BASE}${endpoint}`;
  videoPlayer.src = url;
  videoPlayer.load();
  videoPlayer.play().catch(() => {
    // Autoplay might be blocked; ignore
  });
}

// Certificate verification
function initVerifyForm() {
  if (!verifyForm || !verifyResult) return;
  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    verifyResult.innerHTML = '<p class="small-text">Verifying certificate...</p>';

    const certificateId = verifyForm.certificateId.value.trim();
    if (!certificateId) {
      verifyResult.innerHTML = '<p class="form-message error">Please enter a Certificate ID.</p>';
      return;
    }

    try {
      const data = await apiRequest('/certificates/verify', {
        method: 'POST',
        body: JSON.stringify({ certificateId })
      });

      if (!data.valid) {
        verifyResult.innerHTML = `
          <div class="verify-status invalid">
            <span>Status:</span>
            <strong>Invalid / Not Found</strong>
          </div>
          <p class="form-hint">This certificate could not be validated. Please confirm the ID with the student.</p>
        `;
        return;
      }

      const date = new Date(data.issueDate);
      const dateStr = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      verifyResult.innerHTML = `
        <div class="verify-status valid">
          <span>Status:</span>
          <strong>${data.status}</strong>
        </div>
        <table class="verify-table">
          <tr>
            <th>Student Name</th>
            <td>${data.studentName}</td>
          </tr>
          <tr>
            <th>Course</th>
            <td>${data.courseName}</td>
          </tr>
          <tr>
            <th>Certificate ID</th>
            <td>${data.certificateId}</td>
          </tr>
          <tr>
            <th>Issue Date</th>
            <td>${dateStr}</td>
          </tr>
        </table>
      `;
    } catch (err) {
      verifyResult.innerHTML = `<p class="form-message error">${err.message}</p>`;
    }
  });
}

// Contact form
function initContactForm() {
  if (!contactForm) return;
  const contactMessageEl = document.createElement('p');
  contactMessageEl.className = 'form-message';
  contactForm.appendChild(contactMessageEl);

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    contactMessageEl.textContent = '';
    contactMessageEl.className = 'form-message';
    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const phone = contactForm.phone.value.trim();
    const subject = contactForm.subject.value;
    const message = contactForm.message.value.trim();
    if (!name || !email || !phone || !subject || !message) {
      contactMessageEl.textContent = 'Please fill in all fields.';
      contactMessageEl.classList.add('error');
      return;
    }
    const phonePattern = /^[+]?[(]?[0-9]{1,4}[)]?[-s./0-9]*$/;
    if (!phonePattern.test(phone)) {
      contactMessageEl.textContent = 'Please enter a valid phone number.';
      contactMessageEl.classList.add('error');
      return;
    }
    try {
      const data = await apiRequest('/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, subject, message })
      });
      contactMessageEl.textContent = data.message || 'Message sent successfully.';
      contactMessageEl.classList.add('success');
      contactForm.reset();
    } catch (err) {
      contactMessageEl.textContent = err.message || 'Unable to submit the form. Please try again.';
      contactMessageEl.classList.add('error');
    }
  });
}

// Event listeners & initialization
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

setActiveNavByPage();

if (navToggle && navLinksContainer) {
  navToggle.addEventListener('click', () => {
    navLinksContainer.classList.toggle('open');
  });
}

if (openAuthModalBtn) openAuthModalBtn.addEventListener('click', () => openAuthModal('login'));
if (heroAuthBtn) heroAuthBtn.addEventListener('click', () => openAuthModal('login'));
if (footerAuthBtn) footerAuthBtn.addEventListener('click', () => openAuthModal('login'));
if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', closeAuthModal);

modalTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    switchTab(tab.dataset.tab);
  });
});

if (authModal) {
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) {
      closeAuthModal();
    }
  });
}

// Login form
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loginMessage) return;
    loginMessage.textContent = '';
    loginMessage.className = 'form-message';

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value;

    if (!email || !password) {
      loginMessage.textContent = 'Please fill in all fields.';
      loginMessage.classList.add('error');
      return;
    }

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      saveAuth(data.token, data.user);
      loginMessage.textContent = 'Login successful.';
      loginMessage.classList.add('success');
      setTimeout(() => {
        closeAuthModal();
        // If there is a dashboard on this page, scroll to it
        if (dashboardSection) {
          dashboardSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          // Otherwise, navigate to training page
          window.location.href = 'training.html';
        }
      }, 600);
    } catch (err) {
      loginMessage.textContent = err.message || 'Login failed. Please try again.';
      loginMessage.classList.add('error');
    }
  });
}

// Signup form
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!signupMessage) return;
    signupMessage.textContent = '';
    signupMessage.className = 'form-message';

    const fullName = signupForm.fullName.value.trim();
    const email = signupForm.email.value.trim();
    const password = signupForm.password.value;

    if (!fullName || !email || !password) {
      signupMessage.textContent = 'Please fill in all fields.';
      signupMessage.classList.add('error');
      return;
    }

    if (password.length < 6) {
      signupMessage.textContent = 'Password must be at least 6 characters.';
      signupMessage.classList.add('error');
      return;
    }

    try {
      const data = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, password })
      });
      saveAuth(data.token, data.user);
      signupMessage.textContent = 'Account created.';
      signupMessage.classList.add('success');
      setTimeout(() => {
        closeAuthModal();
        if (dashboardSection) {
          dashboardSection.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.location.href = 'training.html';
        }
      }, 600);
    } catch (err) {
      signupMessage.textContent = err.message || 'Signup failed. Please try again.';
      signupMessage.classList.add('error');
    }
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    clearAuth();
  });
}

// Initialize page-specific behavior
loadAuth();
loadCourses();
initVerifyForm();
initContactForm();



