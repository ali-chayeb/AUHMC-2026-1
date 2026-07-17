/* ====== AUHMC 2026 — Main Application (Server Mode) ====== */

(function () {
  'use strict';

  // ====== CONFIG ======
  const API_BASE = window.location.origin + '/api';

  // ====== STATE ======
  let CONFERENCE_DATE = new Date('2026-10-15T09:00:00+03:00');
  let TRACKS = [];
  let SCHEDULE = {};
  let COMMITTEES = [];
  let WORKSHOPS = [];
  let SPONSORS = [];
  let THEME = {};
  let HERO = {};
  let STATS = {};
  let POSTERS = [];
  let FOOTER = {};
  let MEDIA = {};

  // ====== FETCH DATA FROM API ======
  async function loadData() {
    try {
      const response = await fetch(`${API_BASE}/content`);
      if (response.ok) {
        const data = await response.json();
        if (data.hero) HERO = data.hero;
        if (data.stats) STATS = data.stats;
        if (data.theme) THEME = data.theme;
        if (data.footer) FOOTER = data.footer;
        if (data.media) MEDIA = data.media;
        if (data.hero && data.hero.date) CONFERENCE_DATE = new Date(data.hero.date + ':00+03:00');
        if (data.tracks && data.tracks.length) TRACKS = data.tracks;
        if (data.schedule && Object.keys(data.schedule).length) SCHEDULE = data.schedule;
        if (data.committees && data.committees.length) COMMITTEES = data.committees;
        if (data.workshops && data.workshops.length) WORKSHOPS = data.workshops;
        if (data.sponsors && data.sponsors.length) SPONSORS = data.sponsors;
        if (data.posters && data.posters.length) POSTERS = data.posters;
        return;
      }
    } catch (e) {
      console.warn('⚠️ API not available. Start the server with: npm start');
    }
    // If API fails, leave empty — data comes from DB seed
  }

  // ====== DOM REFS ======
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ====== APPLY THEME ======
  function applyTheme() {
    if (THEME.primary) {
      document.documentElement.style.setProperty('--primary', THEME.primary);
      document.documentElement.style.setProperty('--primary-light', lightenColor(THEME.primary, 20));
      document.documentElement.style.setProperty('--primary-dark', darkenColor(THEME.primary, 20));
    }
    if (THEME.gold) {
      document.documentElement.style.setProperty('--gold', THEME.gold);
      document.documentElement.style.setProperty('--gold-light', lightenColor(THEME.gold, 15));
      document.documentElement.style.setProperty('--gold-dark', darkenColor(THEME.gold, 15));
    }
  }

  function lightenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }

  function darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
  }

  // ====== APPLY HERO ======
  function applyHero() {
    const badgeEl = document.querySelector('.hero-badge');
    if (badgeEl && HERO.badge) badgeEl.textContent = HERO.badge;

    const titleEl = document.querySelector('.hero-title');
    if (titleEl && HERO.title) titleEl.textContent = HERO.title;

    const subtitleEl = document.querySelector('.hero-subtitle');
    if (subtitleEl && HERO.subtitle) subtitleEl.textContent = HERO.subtitle;

    const quoteEl = document.querySelector('.hero-quote');
    if (quoteEl && HERO.quote) quoteEl.textContent = `"${HERO.quote}"`;

    const heroEl = document.querySelector('.hero');
    if (!heroEl) return;

    // Apply background image from MEDIA if available, otherwise use gradient
    const bgImage = MEDIA.bgImage || HERO.bgImage;
    const overlayOpacity = MEDIA.overlayOpacity || HERO.overlayOpacity || 0.4;

    if (bgImage) {
      heroEl.style.background = `url('${bgImage}') center/cover no-repeat`;
      const overlayEl = document.querySelector('.hero-overlay');
      if (overlayEl) {
        overlayEl.style.opacity = overlayOpacity;
      }
    } else if (HERO.bgColor) {
      heroEl.style.background = `linear-gradient(135deg, ${darkenColor(HERO.bgColor, 30)} 0%, ${HERO.bgColor} 50%, ${lightenColor(HERO.bgColor, 15)} 100%)`;
      const overlayEl = document.querySelector('.hero-overlay');
      if (overlayEl) {
        overlayEl.style.opacity = '';
      }
    }

    const statCards = $$('.about-card');
    if (statCards.length >= 4) {
      const statValues = [
        STATS.days || '5',
        STATS.tracks || '8',
        STATS.lectures || '40+',
        STATS.participants || '300+'
      ];
      statCards.forEach((card, i) => {
        const numEl = card.querySelector('.about-num');
        if (numEl && statValues[i]) numEl.textContent = statValues[i];
      });
    }

    const descEl = document.querySelector('.about-desc');
    if (descEl && STATS.description) descEl.textContent = STATS.description;
  }

  // ====== APPLY MEDIA ======
  function applyMedia() {
    // Apply logo
    if (MEDIA.logo) {
      const logoImg = document.querySelector('.nav-logo img');
      if (!logoImg) {
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo) {
          const img = document.createElement('img');
          img.src = MEDIA.logo;
          img.alt = 'AUHMC Logo';
          img.style.cssText = 'max-height:45px;width:auto;';
          navLogo.innerHTML = '';
          navLogo.appendChild(img);
        }
      } else {
        logoImg.src = MEDIA.logo;
      }
    }

    // Apply favicon
    if (MEDIA.favicon) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = MEDIA.favicon;
    }
  }

  // ====== APPLY FOOTER ======
  function applyFooter() {
    if (FOOTER.text) {
      const fb = document.querySelector('.footer-bottom p');
      if (fb) fb.textContent = FOOTER.text;
    }
    if (FOOTER.email) {
      const emailEl = document.querySelector('.footer-contact p:first-child');
      if (emailEl) emailEl.innerHTML = `<i class="fas fa-envelope"></i> ${FOOTER.email}`;
    }
    if (FOOTER.phone) {
      const phoneEl = document.querySelector('.footer-contact p:nth-child(2)');
      if (phoneEl) phoneEl.innerHTML = `<i class="fas fa-phone"></i> ${FOOTER.phone}`;
    }
  }

  // ====== COUNTDOWN ======
  function updateCountdown() {
    const now = new Date();
    const diff = Math.max(0, CONFERENCE_DATE - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    document.getElementById('cd-days').textContent = String(d).padStart(2, '0');
    document.getElementById('cd-hours').textContent = String(h).padStart(2, '0');
    document.getElementById('cd-mins').textContent = String(m).padStart(2, '0');
    document.getElementById('cd-secs').textContent = String(s).padStart(2, '0');
  }

  // ====== NAVIGATION ======
  function setupNavigation() {
    const navLinks = $$('.nav-links a, [data-nav]');
    const sections = $$('.section');

    function navigateTo(sectionId) {
      navLinks.forEach(link => {
        if (link.dataset.nav === sectionId) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      sections.forEach(s => s.classList.remove('active'));
      const target = document.getElementById('section-' + sectionId);
      if (target) {
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      const navLinksEl = document.getElementById('navLinks');
      if (navLinksEl) navLinksEl.classList.remove('open');
    }

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.dataset.nav;
        if (sectionId) navigateTo(sectionId);
      });
    });

    const navToggle = document.getElementById('navToggle');
    if (navToggle) {
      navToggle.addEventListener('click', () => {
        document.getElementById('navLinks').classList.toggle('open');
      });
    }
  }

  // ====== TRACKS ======
  function renderTracks() {
    const grid = document.getElementById('tracksGrid');
    if (!grid || !TRACKS.length) return;
    grid.innerHTML = TRACKS.map(t => `
      <div class="track-card">
        <div class="track-icon"><i class="fas ${t.icon}"></i></div>
        <h3>${t.title}</h3>
        <p>${t.desc}</p>
      </div>
    `).join('');
  }

  // ====== SCHEDULE ======
  function renderSchedule(day) {
    const grid = document.getElementById('scheduleGrid');
    const filter = document.getElementById('trackFilter');
    const filterVal = filter ? filter.value : 'all';
    const items = SCHEDULE[day] || [];

    const filtered = filterVal === 'all' ? items : items.filter(i => i.track === filterVal);

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="schedule-item" style="justify-content:center;color:var(--gray-400);">لا توجد فعاليات لهذا المسار في هذا اليوم</div>';
      return;
    }

    grid.innerHTML = filtered.map(i => `
      <div class="schedule-item">
        <div class="schedule-time">${i.time}</div>
        <div class="schedule-details">
          <h4>${i.title}</h4>
          ${i.speaker ? `<div class="schedule-speaker"><i class="fas fa-user"></i> ${i.speaker}</div>` : ''}
          <span class="schedule-track">${i.track}</span>
        </div>
      </div>
    `).join('');
  }

  function setupSchedule() {
    const dayTabs = $$('.day-tab');
    const filter = document.getElementById('trackFilter');
    if (!dayTabs.length) return;

    // Populate filter options from schedule data
    if (filter) {
      const allItems = Object.values(SCHEDULE).flat();
      const tracks = [...new Set(allItems.map(i => i.track))];
      tracks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t;
        opt.textContent = t;
        filter.appendChild(opt);
      });
    }

    let currentDay = 1;

    function switchDay(day) {
      currentDay = day;
      dayTabs.forEach(tab => {
        tab.classList.toggle('active', parseInt(tab.dataset.day) === day);
      });
      renderSchedule(day);
    }

    dayTabs.forEach(tab => {
      tab.addEventListener('click', () => switchDay(parseInt(tab.dataset.day)));
    });

    if (filter) {
      filter.addEventListener('change', () => renderSchedule(currentDay));
    }

    switchDay(1);
  }

  // ====== COMMITTEES ======
  function renderCommittees() {
    const grid = document.getElementById('committeesGrid');
    if (!grid || !COMMITTEES.length) return;
    grid.innerHTML = COMMITTEES.map(c => `
      <div class="committee-card">
        <div class="committee-icon"><i class="fas ${c.icon}"></i></div>
        <h3>${c.title}</h3>
        <p>${c.desc}</p>
      </div>
    `).join('');
  }

  // ====== REGISTRATION TABS ======
  function setupRegistrationTabs() {
    const tabs = $$('.reg-tab');
    const panels = $$('.reg-panel');

    if (!tabs.length) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.regtab;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        panels.forEach(p => p.classList.remove('active'));
        const panel = document.getElementById('regPanel-' + target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  // ====== REGISTRATION ======
  function setupRegistration() {
    setupRegistrationTabs();

    const wsContainer = document.getElementById('wsCheckboxes');
    if (wsContainer && WORKSHOPS.length) {
      wsContainer.innerHTML = WORKSHOPS.map((w, i) => `
        <label>
          <input type="checkbox" value="${i}">
          ${w.name} (الطاقة الاستيعابية: ${w.capacity})
        </label>
      `).join('');
    }

    const wsList = document.getElementById('workshopsList');
    if (wsList && WORKSHOPS.length) {
      wsList.innerHTML = WORKSHOPS.map(w => `
        <div class="workshop-item">
          <h4>${w.name}</h4>
          <p>ورشة تفاعلية مع تطبيق عملي</p>
          <span class="ws-capacity"><i class="fas fa-users"></i> ${w.capacity} مقعد</span>
        </div>
      `).join('');
    }

    const regForm = document.getElementById('regForm');
    if (regForm) {
      regForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
          name: document.getElementById('regName')?.value || '',
          phone: document.getElementById('regPhone')?.value || '',
          email: document.getElementById('regEmail')?.value || '',
          specialty: document.getElementById('regSpecialty')?.value || '',
          workplace: document.getElementById('regWorkplace')?.value || '',
          workshops: Array.from(document.querySelectorAll('#wsCheckboxes input:checked')).map(cb => cb.value)
        };

        try {
          const response = await fetch(`${API_BASE}/registrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });

          if (response.ok) {
            regForm.style.display = 'none';
            const successEl = document.getElementById('regSuccess');
            if (successEl) successEl.style.display = 'block';
            return;
          }
        } catch (e) {
          console.warn('⚠️ Server not available');
        }

        alert('تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.');
      });
    }

    // ====== SUBMISSION FORM (with file upload) ======
    const submitForm = document.getElementById('submitForm');
    if (submitForm) {
      submitForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('subName')?.value || '';
        const phone = document.getElementById('subPhone')?.value || '';
        const email = document.getElementById('subEmail')?.value || '';
        const degree = document.getElementById('subDegree')?.value || '';
        const affiliation = document.getElementById('subAffiliation')?.value || '';
        const title = document.getElementById('subTitle')?.value || '';
        const submission_type = document.getElementById('subType')?.value || 'poster';

        if (!name || !phone || !title) {
          alert('يرجى تعبئة الحقول المطلوبة (الاسم، الهاتف، عنوان البحث)');
          return;
        }

        // Build FormData to support file uploads
        const formData = new FormData();
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('degree', degree);
        formData.append('affiliation', affiliation);
        formData.append('title', title);
        formData.append('submission_type', submission_type);

        const cvFile = document.getElementById('subCV')?.files?.[0];
        if (cvFile) {
          formData.append('cv', cvFile);
        }
        const photoFile = document.getElementById('subPhoto')?.files?.[0];
        if (photoFile) {
          formData.append('photo', photoFile);
        }

        try {
          const response = await fetch(`${API_BASE}/registrations/submit`, {
            method: 'POST',
            // No Content-Type header — browser sets multipart/form-data automatically
            body: formData
          });

          if (response.ok) {
            submitForm.style.display = 'none';
            const successEl = document.getElementById('subSuccess');
            if (successEl) successEl.style.display = 'block';
            return;
          } else {
            const err = await response.json();
            alert(err.error || 'حدث خطأ أثناء تقديم البحث');
            return;
          }
        } catch (e) {
          console.warn('⚠️ Server not available');
        }

        alert('تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.');
      });
    }
  }

  // ====== SPONSORS ======
  function renderSponsors() {
    const grid = document.getElementById('sponsorsGrid');
    if (!grid || !SPONSORS.length) return;
    grid.innerHTML = SPONSORS.map(s => {
      const hasLogo = s.logo_url || s.image;
      return `
        <div class="sponsor-card">
          ${hasLogo
            ? `<div class="sponsor-logo"><img src="${s.logo_url || s.image}" alt="${s.name}" loading="lazy"></div>`
            : `<div class="sponsor-placeholder"><i class="fas fa-building"></i></div>`
          }
          <h4>${s.name}</h4>
          <p>${s.desc}</p>
          <span class="sponsor-tier">${s.tier}</span>
        </div>
      `;
    }).join('');
  }

  // ====== SCROLL TO TOP ======
  function setupScrollTop() {
    const btn = document.getElementById('scrollTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ====== ADMIN LINK (hidden in footer) ======
  function setupAdminLink() {
    const fb = document.querySelector('.footer-bottom');
    if (fb) {
      const link = document.createElement('a');
      link.href = 'admin.html';
      link.style.cssText = 'display:inline-block;margin-top:8px;font-size:0.75rem;color:rgba(255,255,255,0.3);text-decoration:none;transition:color 0.3s;';
      link.textContent = '⚙️';
      link.title = 'لوحة التحكم';
      link.addEventListener('mouseenter', () => { link.style.color = 'rgba(255,255,255,0.7)'; });
      link.addEventListener('mouseleave', () => { link.style.color = 'rgba(255,255,255,0.3)'; });
      fb.appendChild(document.createElement('br'));
      fb.appendChild(link);
    }
  }

  // ====== POSTERS ======
  function renderPosters() {
    const grid = document.getElementById('postersGrid');
    if (!grid) return;
    const posters = POSTERS;
    if (posters.length === 0) {
      grid.innerHTML = `
        <div class="poster-placeholder">
          <i class="fas fa-image"></i>
          <p>سيتم إضافة البوسترات العلمية قريباً</p>
        </div>`;
      return;
    }
    grid.innerHTML = posters.map(p => `
      <div class="poster-card">
        <div class="poster-image">
          ${p.image_url ? `<img src="${p.image_url}" alt="${p.title}">` : '<i class="fas fa-file-image"></i>'}
        </div>
        <div class="poster-body">
          <h3>${p.title}</h3>
          <p class="poster-researcher"><i class="fas fa-user"></i> ${p.researcher_name}</p>
          ${p.specialty ? `<p class="poster-specialty"><i class="fas fa-stethoscope"></i> ${p.specialty}</p>` : ''}
          ${p.description ? `<p class="poster-desc">${p.description}</p>` : ''}
        </div>
      </div>
    `).join('');
  }

  // ====== INIT ======
  async function init() {
    await loadData();

    applyTheme();
    applyHero();
    applyMedia();
    applyFooter();

    updateCountdown();
    setInterval(updateCountdown, 1000);

    setupNavigation();
    renderTracks();
    setupSchedule();
    renderCommittees();
    setupRegistration();
    renderSponsors();
    setupScrollTop();
    renderPosters();
    setupAdminLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();