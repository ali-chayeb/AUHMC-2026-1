/* ====== AUHMC 2026 — Admin Panel (Server Mode) ====== */

(function () {
  'use strict';

  // ====== API CONFIG ======
  const API_BASE = window.location.origin + '/api';

  // ====== CONSTANTS ======
  const AUTH_TOKEN_KEY = 'auhmc_admin_token';
  const AUTH_USER_KEY = 'auhmc_admin_user';
  const LOGGED_IN_KEY = 'auhmc_admin_logged_in';
  const AUTH_EMAIL_KEY = 'auhmc_admin_email';

  // ====== STATE ======
  let data = {};
  let editingTrackIndex = -1;
  let editingCommitteeIndex = -1;
  let editingWorkshopIndex = -1;
  let editingSponsorIndex = -1;
  let scheduleFilterDay = 'all';
  let authToken = localStorage.getItem(AUTH_TOKEN_KEY);

  // ====== DOM HELPERS ======
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ====== API HELPERS ======
  async function apiRequest(endpoint, method, body) {
    try {
      const options = {
        method,
        headers: getAuthHeaders()
      };
      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }
      const response = await fetch(`${API_BASE}${endpoint}`, options);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { error: result.error || 'حدث خطأ في الخادم' };
      }
      return result;
    } catch (e) {
      return { error: 'لا يمكن الاتصال بالخادم' };
    }
  }

  async function apiGet(endpoint) {
    return apiRequest(endpoint, 'GET');
  }

  function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }

  async function apiPost(endpoint, body) {
    return apiRequest(endpoint, 'POST', body);
  }

  async function apiPut(endpoint, body) {
    return apiRequest(endpoint, 'PUT', body);
  }

  // ====== LOAD DATA FROM API ======
  async function loadDataFromAPI() {
    if (!authToken) return;
    try {
      const result = await apiGet('/content');
      if (result && !result.error) {
        data = result;
        return true;
      }
    } catch (e) {
      console.warn('Failed to load data from API:', e);
    }
    return false;
  }

  // ====== SAVE DATA TO API ======
  async function saveData() {
    if (!authToken) return;
    const payload = {
      content: {
        hero_badge: data.hero?.badge || '',
        hero_title: data.hero?.title || '',
        hero_subtitle: data.hero?.subtitle || '',
        hero_quote: data.hero?.quote || '',
        hero_date: data.hero?.date || '',
        hero_bgColor: data.hero?.bgColor || '#002366',
        hero_description: data.stats?.description || '',
        stat_days: data.stats?.days || '5',
        stat_tracks: data.stats?.tracks || '8',
        stat_lectures: data.stats?.lectures || '40+',
        stat_participants: data.stats?.participants || '300+',
        media_logo: data.media?.logo || '',
        media_bgImage: data.media?.bgImage || '',
        media_overlayOpacity: data.media?.overlayOpacity || '0.6',
        media_favicon: data.media?.favicon || '',
        theme_primary: data.theme?.primary || '#002366',
        theme_gold: data.theme?.gold || '#D4AF37',
        footer_text: data.footer?.text || '',
        footer_email: data.footer?.email || '',
        footer_phone: data.footer?.phone || ''
      },
      tracks: data.tracks || [],
      schedule: data.schedule || {},
      committees: data.committees || [],
      workshops: data.workshops || [],
      sponsors: data.sponsors || [],
      posters: data.posters || []
    };

    const result = await apiPut('/content/bulk', payload);
    if (result.error) {
      console.warn('⚠️ API sync failed:', result.error);
      showToast('فشل حفظ البيانات على الخادم!', 'error');
    } else {
      showToast('تم حفظ البيانات بنجاح!', 'success');
    }
  }

  // ====== TOAST ======
  function showToast(msg, type) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + (type || '');
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ====== AUTH ======
  function checkAuth() {
    return localStorage.getItem(LOGGED_IN_KEY) === 'true';
  }

  async function apiLogin(email, password) {
    const result = await apiPost('/auth/login', { email, password });
    if (result.token) {
      authToken = result.token;
      localStorage.setItem(AUTH_TOKEN_KEY, authToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
      localStorage.setItem(LOGGED_IN_KEY, 'true');
      localStorage.setItem(AUTH_EMAIL_KEY, email);
      await loadDataFromAPI();
      return { success: true };
    }
    return { success: false, error: result.error || 'فشل تسجيل الدخول' };
  }

  function showAdmin() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('adminWrapper').classList.add('active');
  }

  function showLogin() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('adminWrapper').classList.remove('active');
    localStorage.removeItem(LOGGED_IN_KEY);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    authToken = null;
  }

  // ====== LOGIN HANDLER ======
  function setupLogin() {
    const emailInput = document.getElementById('loginEmail');
    const lastEmail = localStorage.getItem(AUTH_EMAIL_KEY);
    if (emailInput && lastEmail) {
      emailInput.value = lastEmail;
    }

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (document.getElementById('loginEmail').value || '').trim().toLowerCase();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) {
        showToast('يرجى إدخال البريد الإلكتروني وكلمة المرور', 'error');
        return;
      }

      const loginResult = await apiLogin(email, password);
      if (loginResult.success) {
        showToast('تم تسجيل الدخول عبر الخادم!', 'success');
        showAdmin();
      } else {
        showToast(loginResult.error || 'فشل تسجيل الدخول! تحقق من البريد وكلمة المرور.', 'error');
      }
    });
  }

  // ====== NAVIGATION ======
  function setupAdminNav() {
    const links = $$('.sidebar-nav a');
    const pages = $$('.admin-page');
    const pageTitles = {
      hero: 'الرئيسية',
      tracks: 'المسارات العلمية',
      schedule: 'البرنامج العلمي',
      committees: 'اللجان',
      workshops: 'ورشات العمل',
      sponsors: 'الرعاة',
      registrations: 'التسجيلات',
      submissions: 'التقديمات العلمية',
      posters: 'البوسترات العلمية',
      media: 'الوسائط',
      theme: 'المظهر',
      settings: 'الإعدادات'
    };

    links.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.adminPage;
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        pages.forEach(p => p.classList.remove('active'));
        const target = document.getElementById('admin-' + page);
        if (target) target.classList.add('active');
        document.getElementById('pageTitle').textContent = pageTitles[page] || page;

        if (page === 'registrations') {
          loadRegistrations();
          loadStats();
        }
        if (page === 'submissions') loadSubmissions();
        if (page === 'posters') loadPosters();
      });
    });
  }

  // ====== HERO FORM ======
  function setupHeroForm() {
    if (!data.hero) return;
    document.getElementById('heroBadge').value = data.hero.badge || '';
    document.getElementById('heroTitle').value = data.hero.title || '';
    document.getElementById('heroSubtitle').value = data.hero.subtitle || '';
    document.getElementById('heroQuote').value = data.hero.quote || '';
    document.getElementById('heroDate').value = data.hero.date || '';
    document.getElementById('statDays').value = data.stats?.days || '5';
    document.getElementById('statTracks').value = data.stats?.tracks || '8';
    document.getElementById('statLectures').value = data.stats?.lectures || '40+';
    document.getElementById('statParticipants').value = data.stats?.participants || '300+';
    document.getElementById('heroDescription').value = data.stats?.description || '';

    document.getElementById('heroForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!data.hero) data.hero = {};
      data.hero.badge = document.getElementById('heroBadge').value;
      data.hero.title = document.getElementById('heroTitle').value;
      data.hero.subtitle = document.getElementById('heroSubtitle').value;
      data.hero.quote = document.getElementById('heroQuote').value;
      data.hero.date = document.getElementById('heroDate').value;
      saveData();
      showToast('تم حفظ النصوص الرئيسية بنجاح!', 'success');
    });

    document.getElementById('statsForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!data.stats) data.stats = {};
      data.stats.days = document.getElementById('statDays').value;
      data.stats.tracks = document.getElementById('statTracks').value;
      data.stats.lectures = document.getElementById('statLectures').value;
      data.stats.participants = document.getElementById('statParticipants').value;
      data.stats.description = document.getElementById('heroDescription').value;
      saveData();
      showToast('تم حفظ الإحصائيات بنجاح!', 'success');
    });
  }

  // ====== TRACKS ======
  function renderTracks() {
    const list = document.getElementById('tracksList');
    if (!data.tracks) data.tracks = [];
    list.innerHTML = data.tracks.map((t, i) => `
      <div class="cm-item">
        <div class="cm-icon"><i class="fas ${t.icon}"></i></div>
        <div class="cm-info">
          <strong>${t.title}</strong>
          <small>${t.desc}</small>
        </div>
        <div class="cm-actions">
          <button class="btn-sm btn-primary" onclick="window._editTrack(${i})">تعديل</button>
          <button class="btn-sm btn-danger" onclick="window._deleteTrack(${i})">حذف</button>
        </div>
      </div>
    `).join('');
  }

  window._editTrack = function (i) {
    editingTrackIndex = i;
    const t = data.tracks[i];
    if (!t) return;
    document.getElementById('trackId').value = (t.track_id || t.id || '').trim();
    document.getElementById('trackIcon').value = (t.icon || '').trim();
    document.getElementById('trackTitle').value = (t.title || '').trim();
    document.getElementById('trackDesc').value = (t.desc || '').trim();
    document.getElementById('trackForm').querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> تحديث';
  };

  window._deleteTrack = function (i) {
    if (!confirm('هل تريد حذف هذا المسار؟')) return;
    data.tracks.splice(i, 1);
    saveData();
    renderTracks();
    showToast('تم حذف المسار بنجاح', 'success');
  };

  function setupTracks() {
    renderTracks();
    const form = document.getElementById('trackForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const trackId = document.getElementById('trackId').value.trim();
      const icon = document.getElementById('trackIcon').value;
      const title = document.getElementById('trackTitle').value;
      const desc = document.getElementById('trackDesc').value;

      if (editingTrackIndex >= 0) {
        // Update existing track — preserve track_id
        const existing = data.tracks[editingTrackIndex];
        data.tracks[editingTrackIndex] = {
          ...existing,
          track_id: trackId || existing.track_id,
          icon,
          title,
          desc
        };
        editingTrackIndex = -1;
        form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> إضافة';
      } else {
        // Add new track
        const id = trackId || title.replace(/\s+/g, '-').toLowerCase();
        data.tracks.push({ track_id: id, icon, title, desc });
      }

      saveData();
      renderTracks();
      form.reset();
      showToast('تم حفظ المسار بنجاح!', 'success');
    });
  }

  // ====== SCHEDULE ======
  function renderSchedule() {
    const list = document.getElementById('scheduleList');
    const days = { 1: 'اليوم الأول', 2: 'اليوم الثاني', 3: 'اليوم الثالث', 4: 'اليوم الرابع', 5: 'اليوم الخامس' };
    if (!data.schedule) data.schedule = {};

    let html = '';
    for (const [dayNum, dayName] of Object.entries(days)) {
      if (scheduleFilterDay !== 'all' && scheduleFilterDay !== dayNum) continue;
      const items = data.schedule[dayNum] || [];
      html += `<div class="schedule-day-group"><h4 style="color:var(--gold);margin:1rem 0 0.5rem;">${dayName}</h4>`;
      items.forEach((item, idx) => {
        html += `
          <div class="cm-item">
            <div class="cm-info">
              <strong>${item.time}</strong>
              <div>${item.title}</div>
              <small>${item.track}${item.speaker ? ' — ' + item.speaker : ''}</small>
            </div>
            <div class="cm-actions">
              <button class="btn-sm btn-danger" onclick="window._deleteSchedule(${dayNum}, ${idx})">حذف</button>
            </div>
          </div>
        `;
      });
      html += '</div>';
    }
    list.innerHTML = html || '<p style="color:var(--gray-500);text-align:center;">لا توجد فعاليات</p>';
  }

  window._deleteSchedule = function (day, idx) {
    if (!confirm('هل تريد حذف هذه الفعالية؟')) return;
    data.schedule[day].splice(idx, 1);
    saveData();
    renderSchedule();
    showToast('تم حذف الفعالية بنجاح', 'success');
  };

  function setupSchedule() {
    renderSchedule();

    $$('.sched-day-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.sched-day-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        scheduleFilterDay = btn.dataset.day;
        renderSchedule();
      });
    });

    const form = document.getElementById('scheduleForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const day = parseInt(document.getElementById('schedDay').value);
      const time = document.getElementById('schedTime').value;
      const title = document.getElementById('schedTitle').value;
      const speaker = document.getElementById('schedSpeaker').value;
      const track = document.getElementById('schedTrack').value;

      if (!data.schedule[day]) data.schedule[day] = [];
      data.schedule[day].push({ time, title, speaker, track });
      saveData();
      renderSchedule();
      form.reset();
      showToast('تم إضافة الفعالية بنجاح!', 'success');
    });
  }

  // ====== COMMITTEES ======
  function renderCommittees() {
    const list = document.getElementById('committeesList');
    if (!data.committees) data.committees = [];
    list.innerHTML = data.committees.map((c, i) => `
      <div class="cm-item">
        <div class="cm-icon"><i class="fas ${c.icon}"></i></div>
        <div class="cm-info">
          <strong>${c.title}</strong>
          <small>${c.desc}</small>
        </div>
        <div class="cm-actions">
          <button class="btn-sm btn-primary" onclick="window._editCommittee(${i})">تعديل</button>
          <button class="btn-sm btn-danger" onclick="window._deleteCommittee(${i})">حذف</button>
        </div>
      </div>
    `).join('');
  }

  window._editCommittee = function (i) {
    editingCommitteeIndex = i;
    const c = data.committees[i];
    document.getElementById('commIcon').value = c.icon;
    document.getElementById('commTitle').value = c.title;
    document.getElementById('commDesc').value = c.desc;
    document.getElementById('committeeForm').querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> تحديث';
  };

  window._deleteCommittee = function (i) {
    if (!confirm('هل تريد حذف هذه اللجنة؟')) return;
    data.committees.splice(i, 1);
    saveData();
    renderCommittees();
    showToast('تم حذف اللجنة بنجاح', 'success');
  };

  function setupCommittees() {
    renderCommittees();
    const form = document.getElementById('committeeForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const icon = document.getElementById('commIcon').value;
      const title = document.getElementById('commTitle').value;
      const desc = document.getElementById('commDesc').value;

      if (editingCommitteeIndex >= 0) {
        data.committees[editingCommitteeIndex] = { icon, title, desc };
        editingCommitteeIndex = -1;
        form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> إضافة';
      } else {
        data.committees.push({ icon, title, desc });
      }

      saveData();
      renderCommittees();
      form.reset();
      showToast('تم حفظ اللجنة بنجاح!', 'success');
    });
  }

  // ====== WORKSHOPS ======
  function renderWorkshops() {
    const list = document.getElementById('workshopsList');
    if (!data.workshops) data.workshops = [];
    list.innerHTML = data.workshops.map((w, i) => `
      <div class="cm-item">
        <div class="cm-info">
          <strong>${w.name}</strong>
          <small>الطاقة الاستيعابية: ${w.capacity} مقعد</small>
        </div>
        <div class="cm-actions">
          <button class="btn-sm btn-primary" onclick="window._editWorkshop(${i})">تعديل</button>
          <button class="btn-sm btn-danger" onclick="window._deleteWorkshop(${i})">حذف</button>
        </div>
      </div>
    `).join('');
  }

  window._editWorkshop = function (i) {
    editingWorkshopIndex = i;
    const w = data.workshops[i];
    document.getElementById('wsName').value = w.name;
    document.getElementById('wsCapacity').value = w.capacity;
    document.getElementById('workshopForm').querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> تحديث';
  };

  window._deleteWorkshop = function (i) {
    if (!confirm('هل تريد حذف هذه الورشة؟')) return;
    data.workshops.splice(i, 1);
    saveData();
    renderWorkshops();
    showToast('تم حذف الورشة بنجاح', 'success');
  };

  function setupWorkshops() {
    renderWorkshops();
    const form = document.getElementById('workshopForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('wsName').value;
      const capacity = parseInt(document.getElementById('wsCapacity').value);

      if (editingWorkshopIndex >= 0) {
        data.workshops[editingWorkshopIndex] = { name, capacity };
        editingWorkshopIndex = -1;
        form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> إضافة';
      } else {
        data.workshops.push({ name, capacity });
      }

      saveData();
      renderWorkshops();
      form.reset();
      showToast('تم حفظ الورشة بنجاح!', 'success');
    });
  }

  // ====== SPONSORS ======
  function renderSponsors() {
    const list = document.getElementById('sponsorsList');
    if (!data.sponsors) data.sponsors = [];
    list.innerHTML = data.sponsors.map((s, i) => `
      <div class="cm-item">
        <div class="cm-info">
          <strong>${s.name}</strong>
          <small>${s.tier} — ${s.desc}</small>
        </div>
        <div class="cm-actions">
          <button class="btn-sm btn-primary" onclick="window._editSponsor(${i})">تعديل</button>
          <button class="btn-sm btn-danger" onclick="window._deleteSponsor(${i})">حذف</button>
        </div>
      </div>
    `).join('');
  }

  window._editSponsor = function (i) {
    editingSponsorIndex = i;
    const s = data.sponsors[i];
    document.getElementById('spName').value = s.name;
    document.getElementById('spTier').value = s.tier;
    document.getElementById('spDesc').value = s.desc;
    document.getElementById('sponsorForm').querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> تحديث';
  };

  window._deleteSponsor = function (i) {
    if (!confirm('هل تريد حذف هذا الراعي؟')) return;
    data.sponsors.splice(i, 1);
    saveData();
    renderSponsors();
    showToast('تم حذف الراعي بنجاح', 'success');
  };

  function setupSponsors() {
    renderSponsors();
    const form = document.getElementById('sponsorForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('spName').value;
      const tier = document.getElementById('spTier').value;
      const desc = document.getElementById('spDesc').value;

      if (editingSponsorIndex >= 0) {
        data.sponsors[editingSponsorIndex] = { name, tier, desc };
        editingSponsorIndex = -1;
        form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> إضافة';
      } else {
        data.sponsors.push({ name, tier, desc });
      }

      saveData();
      renderSponsors();
      form.reset();
      showToast('تم حفظ الراعي بنجاح!', 'success');
    });
  }

  // ====== MEDIA ======
  function setupMedia() {
    // Logo upload
    document.getElementById('logoInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!data.media) data.media = {};
        data.media.logo = ev.target.result;
        document.getElementById('logoPreview').innerHTML = `<img src="${ev.target.result}" alt="Logo" style="max-height:80px;">`;
        saveData();
        showToast('تم رفع الشعار بنجاح!', 'success');
      };
      reader.readAsDataURL(file);
    });

    // Background image upload
    document.getElementById('bgUpload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (!data.media) data.media = {};
        data.media.bgImage = ev.target.result;
        document.getElementById('bgPreview').style.backgroundImage = `url('${ev.target.result}')`;
        saveData();
        showToast('تم رفع صورة الخلفية بنجاح!', 'success');
      };
      reader.readAsDataURL(file);
    });

    // Background color
    document.getElementById('heroBgColor').addEventListener('input', (e) => {
      if (!data.hero) data.hero = {};
      data.hero.bgColor = e.target.value;
      document.getElementById('heroBgColorText').value = e.target.value;
      document.getElementById('bgPreview').style.backgroundColor = e.target.value;
    });
    document.getElementById('heroBgColorText').addEventListener('input', (e) => {
      if (!data.hero) data.hero = {};
      data.hero.bgColor = e.target.value;
      document.getElementById('heroBgColor').value = e.target.value;
      document.getElementById('bgPreview').style.backgroundColor = e.target.value;
    });

    document.getElementById('saveHeroBgColor').addEventListener('click', () => {
      saveData();
      showToast('تم حفظ لون الخلفية!', 'success');
    });

    document.getElementById('removeBgBtn').addEventListener('click', () => {
      if (data.media) data.media.bgImage = null;
      document.getElementById('bgPreview').style.backgroundImage = 'none';
      document.getElementById('bgUpload').value = '';
      saveData();
      showToast('تم إزالة صورة الخلفية', 'info');
    });

    // Overlay opacity control
    const overlayRange = document.getElementById('overlayOpacityRange');
    const overlayValue = document.getElementById('overlayOpacityValue');
    if (overlayRange && overlayValue) {
      // Load saved value from data.media
      const currentOpacity = (data.media && data.media.overlayOpacity) || '0.6';
      overlayRange.value = currentOpacity;
      overlayValue.textContent = parseFloat(currentOpacity).toFixed(2);

      overlayRange.addEventListener('input', () => {
        overlayValue.textContent = parseFloat(overlayRange.value).toFixed(2);
      });

      document.getElementById('saveOverlayOpacity').addEventListener('click', () => {
        if (!data.media) data.media = {};
        data.media.overlayOpacity = parseFloat(overlayRange.value);
        saveData();
        showToast('تم حفظ شفافية الـ overlay بنجاح!', 'success');
      });
    }

    document.getElementById('removeLogoBtn').addEventListener('click', () => {
      if (data.media) data.media.logo = null;
      document.getElementById('logoPreview').innerHTML = '<i class="fas fa-image"></i>';
      document.getElementById('logoInput').value = '';
      saveData();
      showToast('تم إزالة الشعار', 'info');
    });
  }

  // ====== THEME ======
  function setupTheme() {
    if (!data.theme) data.theme = { primary: '#002366', gold: '#D4AF37' };
    document.getElementById('colorPrimary').value = data.theme.primary;
    document.getElementById('colorPrimaryText').value = data.theme.primary;
    document.getElementById('colorGold').value = data.theme.gold;
    document.getElementById('colorGoldText').value = data.theme.gold;

    document.getElementById('colorPrimary').addEventListener('input', (e) => {
      document.getElementById('colorPrimaryText').value = e.target.value;
    });
    document.getElementById('colorPrimaryText').addEventListener('input', (e) => {
      document.getElementById('colorPrimary').value = e.target.value;
    });
    document.getElementById('colorGold').addEventListener('input', (e) => {
      document.getElementById('colorGoldText').value = e.target.value;
    });
    document.getElementById('colorGoldText').addEventListener('input', (e) => {
      document.getElementById('colorGold').value = e.target.value;
    });

    document.getElementById('themeForm').addEventListener('submit', (e) => {
      e.preventDefault();
      data.theme.primary = document.getElementById('colorPrimary').value;
      data.theme.gold = document.getElementById('colorGold').value;
      saveData();
      showToast('تم حفظ الألوان بنجاح!', 'success');
    });

    document.getElementById('resetColorsBtn').addEventListener('click', () => {
      data.theme.primary = '#002366';
      data.theme.gold = '#D4AF37';
      document.getElementById('colorPrimary').value = '#002366';
      document.getElementById('colorPrimaryText').value = '#002366';
      document.getElementById('colorGold').value = '#D4AF37';
      document.getElementById('colorGoldText').value = '#D4AF37';
      saveData();
      showToast('تم إعادة الألوان الافتراضية', 'info');
    });

    // Footer
    if (!data.footer) data.footer = {};
    document.getElementById('footerText').value = data.footer.text || '';
    document.getElementById('footerEmail').value = data.footer.email || '';
    document.getElementById('footerPhone').value = data.footer.phone || '';

    document.getElementById('footerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      data.footer.text = document.getElementById('footerText').value;
      data.footer.email = document.getElementById('footerEmail').value;
      data.footer.phone = document.getElementById('footerPhone').value;
      saveData();
      showToast('تم حفظ الفوتر بنجاح!', 'success');
    });
  }

  // ====== SETTINGS ======
  function setupSettings() {
    // Change password
    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const current = document.getElementById('currentPassword').value;
      const newPwd = document.getElementById('newPassword').value;

      if (newPwd.length < 6) {
        showToast('كلمة المرور يجب أن تكون 6 أحرف على الأقل!', 'error');
        return;
      }

      const result = await apiPost('/auth/change-password', { currentPassword: current, newPassword: newPwd });
      if (result.error) {
        showToast(result.error, 'error');
      } else {
        showToast('تم تغيير كلمة المرور بنجاح!', 'success');
        document.getElementById('passwordForm').reset();
      }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
      showLogin();
      showToast('تم تسجيل الخروج', 'info');
    });
  }

  // ====== REGISTRATIONS VIEWER ======
  async function loadRegistrations() {
    const container = document.getElementById('registrationsContainer');
    if (!container) return;

    if (!authToken) {
      container.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:2rem;">⚠️ يجب تسجيل الدخول عبر الخادم لعرض التسجيلات</p>';
      return;
    }

    const result = await apiGet('/registrations');
    if (result.error) {
      container.innerHTML = `<p style="color:var(--danger);text-align:center;padding:2rem;">⚠️ ${result.error}</p>`;
      return;
    }

    const registrations = result;
    if (registrations.length === 0) {
      container.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:2rem;">لا توجد تسجيلات بعد</p>';
      return;
    }

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
          <thead>
            <tr style="background:var(--primary);color:white;">
              <th style="padding:0.75rem;">#</th>
              <th style="padding:0.75rem;">الاسم</th>
              <th style="padding:0.75rem;">الهاتف</th>
              <th style="padding:0.75rem;">البريد</th>
              <th style="padding:0.75rem;">الاختصاص</th>
              <th style="padding:0.75rem;">جهة العمل</th>
              <th style="padding:0.75rem;">الورشات</th>
              <th style="padding:0.75rem;">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            ${registrations.map((r, i) => `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:0.75rem;">${i + 1}</td>
                <td style="padding:0.75rem;">${r.name}</td>
                <td style="padding:0.75rem;">${r.phone}</td>
                <td style="padding:0.75rem;">${r.email || '-'}</td>
                <td style="padding:0.75rem;">${r.specialty || '-'}</td>
                <td style="padding:0.75rem;">${r.workplace || '-'}</td>
                <td style="padding:0.75rem;">${(r.workshops ? JSON.parse(r.workshops) : []).length}</td>
                <td style="padding:0.75rem;">${new Date(r.created_at).toLocaleDateString('ar-SY')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p style="margin-top:1rem;color:var(--gray-500);font-size:0.85rem;">إجمالي المسجلين: ${registrations.length}</p>
    `;
  }

  // ====== STATS ======
  async function loadStats() {
    try {
      const stats = await apiGet('/registrations/stats');
      if (stats && !stats.error) {
        document.getElementById('statTotalRegistrations').textContent = stats.total || 0;
        document.getElementById('statTodayRegistrations').textContent = stats.today || 0;
        document.getElementById('statTotalSubmissions').textContent = stats.submissions || 0;
        document.getElementById('statPendingSubmissions').textContent = stats.pendingSubmissions || 0;
      }
    } catch (e) {
      // Stats silently fail
    }
  }

  // ====== SUBMISSIONS VIEWER ======
  async function loadSubmissions() {
    const container = document.getElementById('submissionsContainer');
    if (!container) return;

    if (!authToken) {
      container.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:2rem;">⚠️ يجب تسجيل الدخول أولاً</p>';
      return;
    }

    const result = await apiGet('/registrations/submissions');
    if (result.error) {
      container.innerHTML = `<p style="color:var(--danger);text-align:center;padding:2rem;">⚠️ ${result.error}</p>`;
      return;
    }

    const submissions = result;
    if (submissions.length === 0) {
      container.innerHTML = '<p style="color:var(--gray-500);text-align:center;padding:2rem;">لا توجد تقديمات بعد</p>';
      return;
    }

    container.innerHTML = `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
          <thead>
            <tr style="background:var(--primary);color:white;">
              <th style="padding:0.75rem;">#</th>
              <th style="padding:0.75rem;">الاسم</th>
              <th style="padding:0.75rem;">الهاتف</th>
              <th style="padding:0.75rem;">البريد</th>
              <th style="padding:0.75rem;">الدرجة العلمية</th>
              <th style="padding:0.75rem;">جهة الانتساب</th>
              <th style="padding:0.75rem;">عنوان البحث</th>
              <th style="padding:0.75rem;">النوع</th>
              <th style="padding:0.75rem;">CV</th>
              <th style="padding:0.75rem;">الصورة</th>
              <th style="padding:0.75rem;">الحالة</th>
              <th style="padding:0.75rem;">التاريخ</th>
              <th style="padding:0.75rem;">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${submissions.map(s => `
              <tr style="border-bottom:1px solid var(--border);">
                <td style="padding:0.75rem;">${s.id}</td>
                <td style="padding:0.75rem;">${s.name}</td>
                <td style="padding:0.75rem;">${s.phone}</td>
                <td style="padding:0.75rem;">${s.email || '-'}</td>
                <td style="padding:0.75rem;">${s.degree || '-'}</td>
                <td style="padding:0.75rem;">${s.affiliation || '-'}</td>
                <td style="padding:0.75rem;">${s.title}</td>
                <td style="padding:0.75rem;"><span class="badge badge-info">${s.submission_type}</span></td>
                <td style="padding:0.75rem;">${s.cv_path ? `<a href="${s.cv_path}" target="_blank" class="btn-sm btn-primary" style="text-decoration:none;font-size:0.75rem;"><i class="fas fa-download"></i> تحميل CV</a>` : '-'}</td>
                <td style="padding:0.75rem;">${s.photo_path ? `<a href="${s.photo_path}" target="_blank"><img src="${s.photo_path}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;border:2px solid var(--primary);" alt="صورة"></a>` : '-'}</td>
                <td style="padding:0.75rem;"><span class="badge ${s.status === 'approved' ? 'badge-success' : s.status === 'rejected' ? 'badge-danger' : 'badge-warning'}">${s.status === 'approved' ? 'مقبول' : s.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}</span></td>
                <td style="padding:0.75rem;">${new Date(s.created_at).toLocaleDateString('ar-SY')}</td>
                <td style="padding:0.75rem;">
                  <select class="status-select" data-id="${s.id}" onchange="window._updateSubmissionStatus(${s.id}, this.value)" style="font-size:0.75rem;padding:4px;border-radius:4px;border:1px solid #ccc;">
                    <option value="pending" ${s.status === 'pending' ? 'selected' : ''}>قيد المراجعة</option>
                    <option value="approved" ${s.status === 'approved' ? 'selected' : ''}>مقبول</option>
                    <option value="rejected" ${s.status === 'rejected' ? 'selected' : ''}>مرفوض</option>
                  </select>
                  <button class="btn-sm btn-danger" onclick="window._deleteSubmission(${s.id})" style="margin-top:4px;">حذف</button>
                </td>
              </tr>
            `).join('')}
              </tbody>
            </table>
          </div>
          <p style="margin-top:1rem;color:var(--gray-500);font-size:0.85rem;">إجمالي التقديمات: ${submissions.length}</p>
        `;
  }

  window._updateSubmissionStatus = async function (id, status) {
    const result = await apiPatch(`/registrations/submissions/${id}/status`, { status });
    if (!result.error) {
      showToast('تم تحديث حالة البحث', 'success');
    } else {
      showToast(result.error, 'error');
    }
  };

  window._deleteSubmission = async function (id) {
    if (!confirm('هل تريد حذف هذا البحث؟')) return;
    const result = await apiRequest(`/registrations/submissions/${id}`, 'DELETE');
    if (!result.error) {
      showToast('تم حذف البحث', 'success');
      loadSubmissions();
    } else {
      showToast(result.error, 'error');
    }
  };

  // ====== POSTERS ======
  let editingPosterIndex = -1;

  function renderPosters(posters) {
    const list = document.getElementById('postersList');
    if (!list) return;
    list.innerHTML = posters.map((p, i) => `
      <div class="cm-item">
        <div class="cm-info" style="flex:1;">
          <strong>${p.title}</strong>
          <small>الباحث: ${p.researcher_name} ${p.specialty ? '— ' + p.specialty : ''}</small>
          ${p.description ? `<small style="display:block;color:var(--gray-500);">${p.description}</small>` : ''}
        </div>
        <div class="cm-actions">
          <button class="btn-sm btn-primary" onclick="window._editPoster(${i})">تعديل</button>
          <button class="btn-sm btn-danger" onclick="window._deletePoster(${i})">حذف</button>
        </div>
      </div>
    `).join('');
  }

  window._editPoster = function (i) {
    editingPosterIndex = i;
    const posters = data.posters || [];
    const p = posters[i];
    if (!p) return;
    document.getElementById('posterTitle').value = p.title;
    document.getElementById('posterResearcher').value = p.researcher_name;
    document.getElementById('posterSpecialty').value = p.specialty || '';
    document.getElementById('posterImageUrl').value = p.image_url || '';
    document.getElementById('posterDescription').value = p.description || '';
    document.getElementById('posterForm').querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-save"></i> تحديث';
  };

  window._deletePoster = function (i) {
    if (!confirm('هل تريد حذف هذا البوستر؟')) return;
    data.posters.splice(i, 1);
    saveData();
    renderPosters(data.posters || []);
    showToast('تم حذف البوستر', 'success');
  };

  async function loadPosters() {
    const container = document.getElementById('postersList');
    if (!container) return;

    // Load posters from API content endpoint first
    const result = await apiGet('/content');
    if (!result.error && result.posters && Array.isArray(result.posters)) {
      data.posters = result.posters;
      renderPosters(data.posters);
      return;
    }

    // Fallback: use local data
    if (!data.posters) data.posters = [];
    renderPosters(data.posters);
  }

  function setupPosters() {
    const form = document.getElementById('posterForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('posterTitle').value;
      const researcher_name = document.getElementById('posterResearcher').value;
      const specialty = document.getElementById('posterSpecialty').value;
      const image_url = document.getElementById('posterImageUrl').value;
      const description = document.getElementById('posterDescription').value;

      if (!data.posters) data.posters = [];

      if (editingPosterIndex >= 0) {
        data.posters[editingPosterIndex] = { title, researcher_name, specialty, image_url, description };
        editingPosterIndex = -1;
        form.querySelector('button[type="submit"]').innerHTML = '<i class="fas fa-plus"></i> إضافة';
      } else {
        data.posters.push({ title, researcher_name, specialty, image_url, description });
      }

      saveData();
      renderPosters(data.posters);
      form.reset();
      showToast('تم حفظ البوستر بنجاح!', 'success');
    });
  }

  // ====== API PATCH HELPER ======
  async function apiPatch(endpoint, body) {
    return apiRequest(endpoint, 'PATCH', body);
  }

  // ====== ICON PICKER ======
  const ICON_LIST = [
    // Medical
    'fa-heartbeat', 'fa-heart', 'fa-heart-pulse', 'fa-stethoscope', 'fa-syringe', 'fa-pills',
    'fa-capsules', 'fa-tablets', 'fa-baby', 'fa-baby-carriage', 'fa-child', 'fa-user-md',
    'fa-user-nurse', 'fa-ambulance', 'fa-hospital', 'fa-clinic-medical', 'fa-notes-medical',
    'fa-file-medical', 'fa-file-prescription', 'fa-prescription-bottle', 'fa-vial', 'fa-flask',
    'fa-microscope', 'fa-x-ray', 'fa-bone', 'fa-tooth', 'fa-eye', 'fa-ear', 'fa-lungs',
    'fa-brain', 'fa-dna', 'fa-virus', 'fa-bacteria', 'fa-scalpel', 'fa-procedures',
    'fa-bed', 'fa-weight', 'fa-heartbeat', 'fa-diagnoses', 'fa-inhaler', 'fa-crutch',
    'fa-first-aid', 'fa-medkit', 'fa-surgery', 'fa-teeth', 'fa-blind', 'fa-deaf',
    // Science & Education
    'fa-flask', 'fa-atom', 'fa-dna', 'fa-microscope', 'fa-graduation-cap', 'fa-book',
    'fa-book-open', 'fa-book-medical', 'fa-chalkboard-teacher', 'fa-school', 'fa-university',
    'fa-globe', 'fa-earth-asia', 'fa-leaf', 'fa-seedling', 'fa-lightbulb', 'fa-cogs',
    'fa-robot', 'fa-microchip', 'fa-chart-line', 'fa-chart-bar', 'fa-chart-pie',
    'fa-calculator', 'fa-square-root-variable', 'fa-sigma', 'fa-percent',
    // General
    'fa-crown', 'fa-star', 'fa-trophy', 'fa-medal', 'fa-award', 'fa-certificate',
    'fa-shield-alt', 'fa-shield-halved', 'fa-tasks', 'fa-check-circle', 'fa-check-double',
    'fa-bullhorn', 'fa-bullseye', 'fa-flag', 'fa-fire', 'fa-bolt', 'fa-magnet',
    'fa-hand-holding-heart', 'fa-handshake', 'fa-hands-helping', 'fa-users', 'fa-user-friends',
    'fa-user-tie', 'fa-user-graduate', 'fa-building', 'fa-building-columns', 'fa-industry',
    'fa-truck', 'fa-box', 'fa-pallet', 'fa-phone', 'fa-envelope', 'fa-fax',
    'fa-clock', 'fa-calendar', 'fa-calendar-alt', 'fa-calendar-check', 'fa-calendar-day',
    'fa-map-marker-alt', 'fa-map-pin', 'fa-map', 'fa-location-dot', 'fa-compass',
    'fa-globe-asia', 'fa-plane', 'fa-car', 'fa-bus', 'fa-train',
    // Technology
    'fa-laptop', 'fa-laptop-medical', 'fa-desktop', 'fa-tablet', 'fa-mobile',
    'fa-database', 'fa-server', 'fa-cloud', 'fa-wifi', 'fa-network-wired',
    'fa-code', 'fa-terminal', 'fa-bug', 'fa-shield', 'fa-lock', 'fa-key',
    'fa-camera', 'fa-video', 'fa-headphones', 'fa-microphone', 'fa-print',
    // UI & Arrows
    'fa-arrow-right', 'fa-arrow-left', 'fa-arrow-up', 'fa-arrow-down',
    'fa-chevron-right', 'fa-chevron-left', 'fa-chevron-up', 'fa-chevron-down',
    'fa-plus', 'fa-minus', 'fa-times', 'fa-check', 'fa-search', 'fa-filter',
    'fa-sliders-h', 'fa-sliders', 'fa-edit', 'fa-pen', 'fa-pencil-alt',
    'fa-trash', 'fa-trash-alt', 'fa-copy', 'fa-paste', 'fa-cut', 'fa-save',
    'fa-upload', 'fa-download', 'fa-sync', 'fa-sync-alt', 'fa-redo', 'fa-undo',
    'fa-share', 'fa-share-alt', 'fa-link', 'fa-external-link-alt', 'fa-external-link',
    'fa-expand', 'fa-compress', 'fa-maximize', 'fa-minimize',
    // Shapes & Misc
    'fa-circle', 'fa-square', 'fa-diamond', 'fa-triangle-exclamation',
    'fa-exclamation-circle', 'fa-exclamation-triangle', 'fa-info-circle',
    'fa-question-circle', 'fa-question', 'fa-asterisk', 'fa-hashtag',
    'fa-at', 'fa-dollar-sign', 'fa-euro-sign', 'fa-pound-sign', 'fa-yen-sign',
    'fa-music', 'fa-image', 'fa-photo-video', 'fa-film', 'fa-play', 'fa-pause',
    'fa-stop', 'fa-forward', 'fa-backward', 'fa-step-forward', 'fa-step-backward',
    'fa-sun', 'fa-moon', 'fa-cloud-sun', 'fa-cloud-moon', 'fa-snowflake',
    'fa-bolt', 'fa-wind', 'fa-droplet', 'fa-water', 'fa-fire-flame-simple',
    'fa-mountain', 'fa-tree', 'fa-flower', 'fa-pagelines', 'fa-feather',
    'fa-cat', 'fa-dog', 'fa-horse', 'fa-fish', 'fa-bug', 'fa-spider',
    'fa-egg', 'fa-apple-whole', 'fa-carrot', 'fa-lemon', 'fa-cheese',
    'fa-mug-saucer', 'fa-mug-hot', 'fa-wine-glass', 'fa-wine-bottle',
    'fa-utensils', 'fa-kitchen-set', 'fa-bowl-food', 'fa-plate-wheat',
    'fa-bread-slice', 'fa-pizza-slice', 'fa-burger', 'fa-hotdog',
    'fa-ice-cream', 'fa-cake-candles', 'fa-candy-cane', 'fa-cookie',
    'fa-gift', 'fa-gem', 'fa-ring', 'fa-crown', 'fa-cross', 'fa-star-and-crescent',
    'fa-place-of-worship', 'fa-church', 'fa-mosque', 'fa-synagogue',
    'fa-kaaba', 'fa-dharmachakra', 'fa-yin-yang', 'fa-peace',
    'fa-hand', 'fa-hand-peace', 'fa-hand-fist', 'fa-hand-sparkles',
    'fa-thumbs-up', 'fa-thumbs-down', 'fa-face-smile', 'fa-face-frown',
    'fa-face-meh', 'fa-face-grin', 'fa-face-grin-stars', 'fa-face-kiss',
    'fa-face-sad-tear', 'fa-face-laugh', 'fa-face-angry',
    'fa-flag', 'fa-flag-checkered', 'fa-palette', 'fa-paint-brush',
    'fa-paint-roller', 'fa-fill-drip', 'fa-eraser', 'fa-ruler',
    'fa-ruler-combined', 'fa-ruler-horizontal', 'fa-ruler-vertical',
    'fa-tools', 'fa-wrench', 'fa-hammer', 'fa-screwdriver-wrench',
    'fa-screwdriver', 'fa-tape', 'fa-broom', 'fa-soap', 'fa-toilet-paper',
    'fa-bell', 'fa-bell-on', 'fa-bell-slash', 'fa-alarm-clock',
    'fa-stopwatch', 'fa-hourglass', 'fa-hourglass-start', 'fa-hourglass-end',
    'fa-timer', 'fa-clock', 'fa-clock-desk', 'fa-watch', 'fa-stopwatch-20',
    'fa-infinity', 'fa-recycle', 'fa-receipt', 'fa-ticket', 'fa-tag',
    'fa-tags', 'fa-barcode', 'fa-qrcode', 'fa-address-card', 'fa-id-card',
    'fa-credit-card', 'fa-money-bill', 'fa-money-bill-wave', 'fa-coins',
    'fa-sack-dollar', 'fa-sack-xmark', 'fa-basket-shopping', 'fa-cart-shopping',
    'fa-bag-shopping', 'fa-store', 'fa-shop', 'fa-gem', 'fa-rocket',
    'fa-space-shuttle', 'fa-satellite', 'fa-satellite-dish', 'fa-telescope',
    'fa-binoculars', 'fa-compass', 'fa-map', 'fa-globe', 'fa-location-dot',
    'fa-street-view', 'fa-earth-americas', 'fa-earth-africa', 'fa-earth-asia',
    'fa-earth-europe', 'fa-earth-oceania'
  ];

  let iconPickerCallback = null;

  function renderIconPicker(filter) {
    const grid = document.getElementById('iconPickerGrid');
    if (!grid) return;
    const icons = filter
      ? ICON_LIST.filter(i => i.includes(filter.toLowerCase()))
      : ICON_LIST;
    grid.innerHTML = icons.map(icon => `
      <div class="icon-picker-item" data-icon="${icon}" title="${icon}">
        <i class="fas ${icon}"></i>
      </div>
    `).join('');

    // Add click handlers
    grid.querySelectorAll('.icon-picker-item').forEach(item => {
      item.addEventListener('click', () => {
        const icon = item.dataset.icon;
        if (iconPickerCallback) {
          iconPickerCallback(icon);
        }
        closeIconPicker();
      });
    });
  }

  function openIconPicker(callback) {
    iconPickerCallback = callback;
    const modal = document.getElementById('iconPickerModal');
    if (modal) {
      modal.style.display = 'flex';
      renderIconPicker('');
      document.getElementById('iconPickerSearch').value = '';
    }
  }

  function closeIconPicker() {
    const modal = document.getElementById('iconPickerModal');
    if (modal) {
      modal.style.display = 'none';
    }
    iconPickerCallback = null;
  }

  function setupIconPicker() {
    // Close button
    document.getElementById('iconPickerClose').addEventListener('click', closeIconPicker);
    document.getElementById('iconPickerOverlay').addEventListener('click', closeIconPicker);

    // Search
    document.getElementById('iconPickerSearch').addEventListener('input', (e) => {
      renderIconPicker(e.target.value);
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeIconPicker();
    });
  }

  // Helper to create icon picker trigger button
  function createIconPickerTrigger(inputId, currentIcon) {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'icon-picker-trigger';
    trigger.innerHTML = `<i class="fas ${currentIcon || 'fa-icons'}"></i> اختر أيقونة`;
    trigger.addEventListener('click', () => {
      openIconPicker((icon) => {
        const input = document.getElementById(inputId);
        if (input) {
          input.value = icon;
          // Update trigger icon
          trigger.innerHTML = `<i class="fas ${icon}"></i> اختر أيقونة`;
        }
      });
    });
    return trigger;
  }

  // Icon picker button handlers for Track and Committee forms
  window._openIconPickerForTrack = function() {
    openIconPicker((icon) => {
      document.getElementById('trackIcon').value = icon;
    });
  };

  window._openIconPickerForCommittee = function() {
    openIconPicker((icon) => {
      document.getElementById('commIcon').value = icon;
    });
  };

  // ====== INIT ======
  async function init() {
    if (checkAuth() && localStorage.getItem(AUTH_TOKEN_KEY)) {
      authToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const loaded = await loadDataFromAPI();
      if (loaded) {
        showAdmin();
      } else {
        showLogin();
      }
    }

    setupLogin();
    setupAdminNav();
    setupHeroForm();
    setupTracks();
    setupSchedule();
    setupCommittees();
    setupWorkshops();
    setupSponsors();
    setupMedia();
    setupTheme();
    setupSettings();
    setupPosters();
    setupIconPicker();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();