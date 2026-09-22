/**
 * SAVING SARVAHITA FOUNDATION - Admin Portal Engine
 * Full CRUD for Completed Events, Upcoming Drives, and Photo Gallery Management.
 */

(function() {
  const DEFAULT_PASSWORD = 'Sarvahita@2026';
  const PASS_STORAGE_KEY = 'sarvahita_admin_pass';
  const AUTH_TOKEN_KEY = 'sarvahita_admin_token';
  const AUTH_EXPIRY_KEY = 'sarvahita_admin_token_expiry';

  // Category metadata definitions
  const CATEGORY_DEFINITIONS = {
    'hunger-support': {
      name: 'Sarva Jeev Raksha',
      icon: 'fa-paw',
      badgeColor: 'linear-gradient(135deg, #16A34A, #059669)',
      tagBg: 'rgba(22, 163, 74, 0.12)',
      tagColor: '#16A34A'
    },
    'study-kits': {
      name: 'Sarva Shiksha (Education)',
      icon: 'fa-graduation-cap',
      badgeColor: 'linear-gradient(135deg, #0284C7, #0E7490)',
      tagBg: 'rgba(2, 132, 199, 0.12)',
      tagColor: '#0284C7'
    },
    'health': {
      name: 'Sarva Swasthya',
      icon: 'fa-heart-pulse',
      badgeColor: 'linear-gradient(135deg, #E11D48, #BE123C)',
      tagBg: 'rgba(225, 29, 72, 0.12)',
      tagColor: '#E11D48'
    },
    'environment': {
      name: 'Sarva Hariyali',
      icon: 'fa-seedling',
      badgeColor: 'linear-gradient(135deg, #059669, #047857)',
      tagBg: 'rgba(5, 150, 105, 0.12)',
      tagColor: '#059669'
    },
    'general': {
      name: 'Community Welfare',
      icon: 'fa-hand-holding-heart',
      badgeColor: 'linear-gradient(135deg, #0E7490, #0369A1)',
      tagBg: 'rgba(14, 116, 144, 0.12)',
      tagColor: '#0E7490'
    }
  };

  let activePhotoEventId = null;

  // Initialize on page load
  document.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    setupDropZone();
  });

  // ==========================================================================
  // AUTHENTICATION & SECURITY
  // ==========================================================================

  function getStoredPassword() {
    return localStorage.getItem(PASS_STORAGE_KEY) || DEFAULT_PASSWORD;
  }

  window.checkAuthState = function() {
    const isToken = sessionStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
    const loginScreen = document.getElementById('loginScreen');
    const adminApp = document.getElementById('adminApp');

    if (isToken === 'true') {
      if (loginScreen) loginScreen.style.display = 'none';
      if (adminApp) adminApp.style.display = 'flex';
      refreshAllData();
    } else {
      if (loginScreen) loginScreen.style.display = 'flex';
      if (adminApp) adminApp.style.display = 'none';
    }
  };

  window.handleAdminLogin = function(e) {
    e.preventDefault();
    const inputPass = document.getElementById('adminPasswordInput').value;
    const rememberMe = document.getElementById('rememberAdmin').checked;
    const alertBox = document.getElementById('loginAlert');

    const validPass = getStoredPassword();

    if (inputPass === validPass) {
      if (alertBox) alertBox.style.display = 'none';
      sessionStorage.setItem(AUTH_TOKEN_KEY, 'true');
      if (rememberMe) {
        localStorage.setItem(AUTH_TOKEN_KEY, 'true');
      }
      showToast('Welcome back, Administrator!', 'success');
      checkAuthState();
    } else {
      if (alertBox) alertBox.style.display = 'block';
      showToast('Invalid password', 'error');
    }
  };

  window.handleAdminLogout = function() {
    if (confirm('Are you sure you want to sign out of the Admin Portal?')) {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      showToast('Logged out successfully', 'info');
      checkAuthState();
    }
  };

  window.togglePasswordVisibility = function(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      if (icon) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      }
    } else {
      input.type = 'password';
      if (icon) {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
  };

  // Change Password
  window.openChangePasswordModal = function() {
    document.getElementById('changePasswordForm').reset();
    document.getElementById('changePasswordModal').classList.add('active');
  };

  window.closeChangePasswordModal = function() {
    document.getElementById('changePasswordModal').classList.remove('active');
  };

  window.saveNewPassword = function(e) {
    e.preventDefault();
    const currentPass = document.getElementById('currentPassInput').value;
    const newPass = document.getElementById('newPassInput').value;
    const confirmPass = document.getElementById('confirmPassInput').value;

    const validPass = getStoredPassword();
    if (currentPass !== validPass) {
      alert('Current password does not match!');
      return;
    }

    if (newPass.length < 6) {
      alert('New password must be at least 6 characters.');
      return;
    }

    if (newPass !== confirmPass) {
      alert('New passwords do not match!');
      return;
    }

    localStorage.setItem(PASS_STORAGE_KEY, newPass);
    closeChangePasswordModal();
    showToast('Admin password updated successfully!', 'success');
  };

  // ==========================================================================
  // NAVIGATION & STATS REFRESH
  // ==========================================================================

  window.switchAdminTab = function(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    if (tabId === 'tab-photos') {
      loadGalleryPhotosForDrive();
    }
  };

  function refreshAllData() {
    const stats = EventsStore.getStats();
    
    // Update summary counts
    document.getElementById('statCompletedCount').textContent = stats.totalDrives;
    document.getElementById('statUpcomingCount').textContent = stats.totalUpcoming;
    document.getElementById('statPhotoCount').textContent = stats.totalPhotos;

    document.getElementById('badgeCompleted').textContent = stats.totalDrives;
    document.getElementById('badgeUpcoming').textContent = stats.totalUpcoming;
    document.getElementById('badgePhotos').textContent = stats.totalPhotos;

    renderCompletedEvents();
    renderUpcomingEvents();
    populatePhotoDriveSelector();
  }

  // ==========================================================================
  // COMPLETED DRIVES & EVENTS TAB
  // ==========================================================================

  function renderCompletedEvents(filterText = '', filterCat = 'all') {
    const container = document.getElementById('eventsContainer');
    if (!container) return;

    let events = EventsStore.getEvents();

    if (filterCat !== 'all') {
      events = events.filter(e => e.category === filterCat);
    }

    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      events = events.filter(e => 
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        (e.date && e.date.toLowerCase().includes(q)) ||
        (e.desc && e.desc.toLowerCase().includes(q))
      );
    }

    if (events.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; background: white; padding: 40px; text-align: center; border-radius: 12px; border: 1px dashed #CBD5E1;">
          <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; color: #94A3B8; margin-bottom: 12px;"></i>
          <h3 style="color: #334155; margin-bottom: 6px;">No drives found</h3>
          <p style="color: #64748B; font-size: 0.9rem;">Try adjusting your search filter or click "+ Add New Drive" to create one.</p>
        </div>
      `;
      return;
    }

    let html = '';
    events.forEach(ev => {
      const coverSrc = ev.coverMedia ? ev.coverMedia.src : (ev.media && ev.media[0] ? ev.media[0].src : 'assets/branding/logo.png');
      const photoCount = ev.media ? ev.media.length : (ev.imageCount || 0);
      const catDef = CATEGORY_DEFINITIONS[ev.category] || CATEGORY_DEFINITIONS['general'];

      html += `
        <div class="admin-event-card">
          <div class="admin-card-banner">
            <img src="${coverSrc}" alt="${ev.title}" onerror="this.src='assets/branding/logo.png'">
            <div class="admin-card-badge">
              <i class="fa-solid ${catDef.icon}"></i> ${catDef.name}
            </div>
            <div class="admin-card-photos-count">
              <i class="fa-solid fa-camera"></i> ${photoCount} Photos
            </div>
          </div>

          <div class="admin-card-body">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div class="admin-card-meta" style="margin-bottom: 0;">
                <span><i class="fa-solid fa-calendar-day" style="color: #0284C7;"></i> ${ev.date}</span>
                <span>•</span>
                <span><i class="fa-solid fa-location-dot" style="color: #F97316;"></i> ${ev.location}</span>
              </div>
              <span class="status-pill status-completed"><i class="fa-solid fa-circle-check"></i> Completed</span>
            </div>

            <h3 class="admin-card-title">${ev.title}</h3>
            <p class="admin-card-desc">${ev.desc}</p>

            <div class="admin-card-footer">
              <button class="btn btn-outline btn-sm" onclick="jumpToEventPhotos('${ev.id}')">
                <i class="fa-solid fa-images"></i> Manage Photos (${photoCount})
              </button>
              <div class="admin-card-footer-actions">
                <button class="btn btn-outline btn-sm" onclick="quickMarkUpcoming('${ev.id}')" title="Change status to Upcoming Event">
                  <i class="fa-solid fa-clock-rotate-left"></i> Set Upcoming
                </button>
                <button class="btn btn-outline btn-sm" onclick="openEventModal('${ev.id}')" title="Edit Drive">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteCompletedEvent('${ev.id}', '${escapeHtml(ev.title)}')" title="Delete Drive">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  window.filterEventsList = function() {
    const text = document.getElementById('eventSearchInput').value;
    const cat = document.getElementById('eventCategoryFilter').value;
    renderCompletedEvents(text, cat);
  };

  // Open Add / Edit Modal for Completed Event
  window.openEventModal = function(eventId = null) {
    const form = document.getElementById('eventForm');
    form.reset();
    document.getElementById('eventEditId').value = '';

    if (eventId) {
      const events = EventsStore.getEvents();
      const ev = events.find(e => e.id === eventId);
      if (ev) {
        document.getElementById('eventModalTitle').textContent = 'Edit Drive / Event';
        document.getElementById('eventEditId').value = ev.id;
        document.getElementById('eventTitle').value = ev.title || '';
        document.getElementById('eventDate').value = ev.sortDate || '';
        document.getElementById('eventCategory').value = ev.category || 'hunger-support';
        document.getElementById('eventLocation').value = ev.location || '';
        document.getElementById('eventBeneficiaries').value = ev.beneficiaries || '';
        document.getElementById('eventSubtitle').value = ev.subtitle || '';
        document.getElementById('eventDesc').value = ev.desc || '';
        document.getElementById('eventBlogUrl').value = ev.blogUrl || '';
        document.getElementById('coverPhotoUploadGroup').style.display = 'none';
      }
    } else {
      document.getElementById('eventModalTitle').textContent = 'Add New Drive / Event';
      document.getElementById('coverPhotoUploadGroup').style.display = 'block';
    }

    document.getElementById('eventModal').classList.add('active');
  };

  window.closeEventModal = function() {
    document.getElementById('eventModal').classList.remove('active');
  };

  window.handleEventDateAutoFill = function(dateStr) {
    // When date is picked, auto-fill helper values if needed
  };

  window.saveEventForm = async function(e) {
    e.preventDefault();
    const editId = document.getElementById('eventEditId').value;
    const title = document.getElementById('eventTitle').value.trim();
    const dateVal = document.getElementById('eventDate').value;
    const category = document.getElementById('eventCategory').value;
    const location = document.getElementById('eventLocation').value.trim();
    const beneficiaries = document.getElementById('eventBeneficiaries').value.trim();
    const subtitle = document.getElementById('eventSubtitle').value.trim();
    const desc = document.getElementById('eventDesc').value.trim();
    const blogUrl = document.getElementById('eventBlogUrl').value.trim() || null;
    const coverFileInput = document.getElementById('eventCoverFile');

    // Parse date parts
    const d = new Date(dateVal);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = monthNames[d.getMonth()] || 'JAN';
    const year = String(d.getFullYear());
    const dateFormatted = `${day} ${month} ${year}`;
    const dateFull = `${day} ${fullMonthNames[d.getMonth()]} ${year}`;

    const catDef = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS['general'];

    let eventData = {
      title,
      subtitle: subtitle || `On-ground community initiative by Saving Sarvahita Foundation`,
      date: dateFormatted,
      dateFull,
      day,
      month,
      year,
      sortDate: dateVal,
      category,
      categoryName: catDef.name,
      categoryIcon: catDef.icon,
      badgeColor: catDef.badgeColor,
      tagBg: catDef.tagBg,
      tagColor: catDef.tagColor,
      location,
      desc,
      beneficiaries: beneficiaries || 'Community',
      blogUrl: blogUrl
    };

    if (editId) {
      eventData.id = editId;
    } else {
      eventData.media = [];
      // If initial cover file selected
      if (coverFileInput && coverFileInput.files && coverFileInput.files[0]) {
        try {
          const compressedDataUrl = await compressImage(coverFileInput.files[0], 1200, 0.85);
          const initialPhoto = {
            id: 'media-' + Date.now().toString(36),
            type: 'image',
            src: compressedDataUrl,
            filename: coverFileInput.files[0].name,
            title: title + ' Cover',
            desc: location
          };
          eventData.media.push(initialPhoto);
          eventData.coverMedia = initialPhoto;
        } catch (err) {
          console.error('Photo compression error:', err);
        }
      }
    }

    EventsStore.saveEvent(eventData);
    closeEventModal();
    refreshAllData();
    showToast(`Drive "${title}" saved successfully!`, 'success');
  };

  window.deleteCompletedEvent = function(eventId, title) {
    if (confirm(`Are you sure you want to delete "${title}"? This will also remove its associated photos.`)) {
      EventsStore.deleteEvent(eventId);
      refreshAllData();
      showToast(`Drive deleted.`, 'info');
    }
  };

  window.jumpToEventPhotos = function(eventId) {
    switchAdminTab('tab-photos');
    const selector = document.getElementById('photoDriveSelector');
    if (selector) {
      selector.value = eventId;
      loadGalleryPhotosForDrive();
    }
  };

  // ==========================================================================
  // UPCOMING EVENTS TAB
  // ==========================================================================

  function renderUpcomingEvents() {
    const container = document.getElementById('upcomingContainer');
    if (!container) return;

    const upcomingList = EventsStore.getUpcomingEvents();

    if (upcomingList.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; background: white; padding: 40px; text-align: center; border-radius: 12px; border: 1px dashed #CBD5E1;">
          <i class="fa-solid fa-bullhorn" style="font-size: 2.5rem; color: #94A3B8; margin-bottom: 12px;"></i>
          <h3 style="color: #334155; margin-bottom: 6px;">No upcoming events scheduled</h3>
          <p style="color: #64748B; font-size: 0.9rem;">Click "+ Add Upcoming Event" to post an upcoming campaign for volunteers and donors.</p>
        </div>
      `;
      return;
    }

    let html = '';
    upcomingList.forEach(item => {
      const bannerSrc = item.image || 'assets/events/animal-feeding-16-aug-2026/animal-feeding-01.webp';
      const catDef = CATEGORY_DEFINITIONS[item.category] || CATEGORY_DEFINITIONS['hunger-support'];

      html += `
        <div class="admin-event-card" style="border-top: 3px solid #F97316;">
          <div class="admin-card-banner">
            <img src="${bannerSrc}" alt="${item.title}" onerror="this.src='assets/branding/logo.png'">
            <div class="admin-card-badge" style="background: rgba(249, 115, 22, 0.9);">
              <i class="fa-solid fa-bullhorn"></i> ${item.badge || 'Upcoming'}
            </div>
          </div>

          <div class="admin-card-body">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <div class="admin-card-meta" style="margin-bottom: 0;">
                <span><i class="fa-solid fa-calendar-day" style="color: #0E7490;"></i> ${item.dateText}</span>
                <span>•</span>
                <span><i class="fa-solid fa-location-dot" style="color: #F97316;"></i> ${item.location}</span>
              </div>
              <span class="status-pill status-upcoming"><i class="fa-solid fa-clock"></i> Upcoming</span>
            </div>

            <h3 class="admin-card-title">${item.title}</h3>
            <p class="admin-card-desc">${item.desc}</p>

            <div style="display: flex; gap: 8px; margin-bottom: 16px;">
              <span style="background: #E0F2FE; color: #0369A1; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                ${item.targetMetric1 || 'Planned Drive'}
              </span>
              <span style="background: #DCFCE7; color: #15803D; font-size: 0.75rem; font-weight: 700; padding: 3px 8px; border-radius: 6px;">
                ${item.targetMetric2 || 'Volunteers Open'}
              </span>
            </div>

            <div class="admin-card-footer">
              <button class="btn btn-green btn-sm" onclick="quickMarkCompleted('${item.id}')" title="Change status to Completed and move to Completed Drives">
                <i class="fa-solid fa-circle-check"></i> Mark Completed
              </button>
              <div class="admin-card-footer-actions">
                <button class="btn btn-outline btn-sm" onclick="openUpcomingModal('${item.id}')">
                  <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteUpcomingEvent('${item.id}', '${escapeHtml(item.title)}')">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  window.openUpcomingModal = function(id = null) {
    const form = document.getElementById('upcomingForm');
    form.reset();
    document.getElementById('upcomingEditId').value = '';

    if (id) {
      const list = EventsStore.getUpcomingEvents();
      const item = list.find(u => u.id === id);
      if (item) {
        document.getElementById('upcomingModalTitle').textContent = 'Edit Upcoming Event';
        document.getElementById('upcomingEditId').value = item.id;
        document.getElementById('upcomingTitle').value = item.title || '';
        document.getElementById('upcomingBadge').value = item.badge || 'Upcoming This Week';
        document.getElementById('upcomingDateText').value = item.dateText || '';
        document.getElementById('upcomingCategory').value = item.category || 'hunger-support';
        document.getElementById('upcomingLocation').value = item.location || '';
        document.getElementById('upcomingMetric1').value = item.targetMetric1 || '';
        document.getElementById('upcomingMetric2').value = item.targetMetric2 || '';
        document.getElementById('upcomingDesc').value = item.desc || '';
      }
    } else {
      document.getElementById('upcomingModalTitle').textContent = 'Add Upcoming Event';
      document.getElementById('upcomingBadge').value = 'Upcoming This Week';
    }

    document.getElementById('upcomingModal').classList.add('active');
  };

  window.closeUpcomingModal = function() {
    document.getElementById('upcomingModal').classList.remove('active');
  };

  window.saveUpcomingForm = async function(e) {
    e.preventDefault();
    const editId = document.getElementById('upcomingEditId').value;
    const title = document.getElementById('upcomingTitle').value.trim();
    const badge = document.getElementById('upcomingBadge').value.trim();
    const dateText = document.getElementById('upcomingDateText').value.trim();
    const category = document.getElementById('upcomingCategory').value;
    const location = document.getElementById('upcomingLocation').value.trim();
    const metric1 = document.getElementById('upcomingMetric1').value.trim();
    const metric2 = document.getElementById('upcomingMetric2').value.trim();
    const desc = document.getElementById('upcomingDesc').value.trim();
    const imageInput = document.getElementById('upcomingImageFile');

    const catDef = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS['hunger-support'];

    let item = {
      title,
      badge: badge || 'Upcoming Event',
      dateText,
      category,
      categoryName: catDef.name,
      categoryIcon: catDef.icon,
      location,
      targetMetric1: metric1 || 'Impact Planned',
      targetMetric2: metric2 || 'Volunteers Welcomed',
      desc
    };

    if (editId) {
      item.id = editId;
      const existing = EventsStore.getUpcomingEvents().find(u => u.id === editId);
      if (existing) {
        item.image = existing.image;
      }
    }

    if (imageInput && imageInput.files && imageInput.files[0]) {
      try {
        const compressed = await compressImage(imageInput.files[0], 1200, 0.85);
        item.image = compressed;
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    } else if (!item.image) {
      item.image = 'assets/events/animal-feeding-16-aug-2026/animal-feeding-01.webp';
    }

    EventsStore.saveUpcomingItem(item);
    closeUpcomingModal();
    refreshAllData();
    showToast(`Upcoming event "${title}" saved!`, 'success');
  };

  window.deleteUpcomingEvent = function(id, title) {
    if (confirm(`Remove upcoming event "${title}"?`)) {
      EventsStore.deleteUpcomingItem(id);
      refreshAllData();
      showToast('Upcoming event removed.', 'info');
    }
  };

  window.convertUpcomingToCompleted = function(id) {
    const list = EventsStore.getUpcomingEvents();
    const item = list.find(u => u.id === id);
    if (!item) return;

    if (confirm(`Convert "${item.title}" into a completed drive? You will be prompted to set the drive date and photos.`)) {
      EventsStore.deleteUpcomingItem(id);
      openEventModal();
      document.getElementById('eventTitle').value = item.title;
      document.getElementById('eventLocation').value = item.location;
      document.getElementById('eventCategory').value = item.category;
      document.getElementById('eventDesc').value = item.desc;
      refreshAllData();
    }
  };

  window.quickMarkCompleted = function(upcomingId) {
    const res = EventsStore.changeStatus(upcomingId, 'completed');
    if (res) {
      refreshAllData();
      showToast('Event status set to Completed! You can now manage and upload drive photos.', 'success');
      switchAdminTab('tab-completed');
    }
  };

  window.quickMarkUpcoming = function(completedId) {
    const res = EventsStore.changeStatus(completedId, 'upcoming');
    if (res) {
      refreshAllData();
      showToast('Event status changed to Upcoming.', 'info');
      switchAdminTab('tab-upcoming');
    }
  };

  // ==========================================================================
  // PHOTO GALLERY MANAGER TAB
  // ==========================================================================

  function populatePhotoDriveSelector() {
    const selector = document.getElementById('photoDriveSelector');
    if (!selector) return;

    const events = EventsStore.getEvents();
    const stats = EventsStore.getStats();
    selector.innerHTML = '';

    // Add "All Photos" option
    const allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = `📸 All Photos — All Drives (${stats.totalPhotos} photos)`;
    selector.appendChild(allOpt);

    events.forEach(ev => {
      const opt = document.createElement('option');
      opt.value = ev.id;
      opt.textContent = `${ev.date} — ${ev.title} (${ev.media ? ev.media.length : 0} photos)`;
      selector.appendChild(opt);
    });

    if (!activePhotoEventId) {
      activePhotoEventId = 'all';
    }
    selector.value = activePhotoEventId;
  }

  window.loadGalleryPhotosForDrive = function() {
    const selector = document.getElementById('photoDriveSelector');
    if (!selector) return;
    activePhotoEventId = selector.value || 'all';

    const grid = document.getElementById('galleryManagerGrid');
    if (!grid) return;

    const events = EventsStore.getEvents();
    let photosList = [];

    if (activePhotoEventId === 'all') {
      events.forEach(ev => {
        if (ev.media && ev.media.length > 0) {
          ev.media.forEach(m => {
            photosList.push({
              photo: m,
              eventId: ev.id,
              eventTitle: ev.title,
              eventDate: ev.date,
              isCover: ev.coverMedia && ev.coverMedia.id === m.id
            });
          });
        }
      });
    } else {
      const ev = events.find(e => e.id === activePhotoEventId);
      if (ev && ev.media) {
        ev.media.forEach(m => {
          photosList.push({
            photo: m,
            eventId: ev.id,
            eventTitle: ev.title,
            eventDate: ev.date,
            isCover: ev.coverMedia && ev.coverMedia.id === m.id
          });
        });
      }
    }

    if (photosList.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; background: white; padding: 36px; text-align: center; border-radius: 12px; border: 1px dashed #CBD5E1;">
          <i class="fa-solid fa-camera-retro" style="font-size: 2.2rem; color: #94A3B8; margin-bottom: 10px;"></i>
          <h4 style="color: #334155; margin-bottom: 4px;">No photos found</h4>
          <p style="color: #64748B; font-size: 0.85rem;">Use the upload box above to add drive moments.</p>
        </div>
      `;
      return;
    }

    let html = '';
    photosList.forEach(item => {
      const photo = item.photo;
      const isCover = item.isCover;
      const eventId = item.eventId;
      const eventTitle = item.eventTitle;
      const eventDate = item.eventDate;

      html += `
        <div class="photo-thumb-card">
          <img src="${photo.src}" alt="${photo.title || 'Photo'}" loading="lazy">
          ${isCover ? '<span class="photo-cover-badge"><i class="fa-solid fa-star"></i> Cover</span>' : ''}
          ${activePhotoEventId === 'all' ? `<span class="photo-drive-tag" title="${escapeHtml(eventTitle)}">${eventDate || 'Drive'}</span>` : ''}
          <div class="photo-thumb-overlay">
            <span style="font-size: 0.72rem; color: #E2E8F0; max-width: 90%; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;">
              ${eventTitle}
            </span>
            <button class="btn btn-outline btn-sm" style="color: white; border-color: white;" onclick="previewPhotoLightbox('${photo.src}')" title="Full Preview">
              <i class="fa-solid fa-magnifying-glass-plus"></i> View
            </button>
            ${!isCover ? `
              <button class="btn btn-green btn-sm" onclick="setEventCoverPhoto('${eventId}', '${photo.id}')" title="Set as Cover">
                <i class="fa-solid fa-star"></i> Set Cover
              </button>
            ` : ''}
            <button class="btn btn-danger btn-sm" onclick="deleteEventPhoto('${eventId}', '${photo.id}')" title="Delete Photo">
              <i class="fa-solid fa-trash-can"></i> Delete
            </button>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;
  };

  function setupDropZone() {
    const zone = document.getElementById('photoDropZone');
    if (!zone) return;

    ['dragenter', 'dragover'].forEach(name => {
      zone.addEventListener(name, (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      zone.addEventListener(name, (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
      });
    });

    zone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handlePhotoUpload(files);
      }
    });
  }

  window.handlePhotoUpload = async function(files) {
    if (!files || files.length === 0) return;
    let targetEventId = document.getElementById('photoDriveSelector').value;
    const events = EventsStore.getEvents();

    if (!targetEventId || targetEventId === 'all') {
      if (events.length > 0) {
        targetEventId = events[0].id;
      } else {
        alert('Please create a drive first before uploading photos.');
        return;
      }
    }

    const targetEvent = events.find(e => e.id === targetEventId);
    showToast(`Optimizing and uploading ${files.length} photo(s) to "${targetEvent ? targetEvent.title : 'Drive'}"...`, 'info');

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const compressedBase64 = await compressImage(file, 1600, 0.82);
        EventsStore.addPhotoToEvent(targetEventId, {
          src: compressedBase64,
          filename: file.name,
          title: file.name.replace(/\.[^/.]+$/, '')
        });
        successCount++;
      } catch (err) {
        console.error('Failed to compress/save photo:', err);
      }
    }

    refreshAllData();
    loadGalleryPhotosForDrive();
    showToast(`Successfully added ${successCount} photo(s)!`, 'success');
  };

  window.deleteEventPhoto = function(eventId, photoId) {
    if (confirm('Delete this photo from the drive?')) {
      EventsStore.deletePhotoFromEvent(eventId, photoId);
      refreshAllData();
      loadGalleryPhotosForDrive();
      showToast('Photo removed.', 'info');
    }
  };

  window.setEventCoverPhoto = function(eventId, photoId) {
    EventsStore.setCoverPhoto(eventId, photoId);
    refreshAllData();
    loadGalleryPhotosForDrive();
    showToast('Cover photo updated!', 'success');
  };

  window.previewPhotoLightbox = function(src) {
    const lightbox = document.getElementById('adminPhotoLightbox');
    const img = document.getElementById('lightboxPreviewImg');
    if (lightbox && img) {
      img.src = src;
      lightbox.classList.add('active');
    }
  };

  // High-performance client-side image compression
  function compressImage(file, maxDimension = 1600, quality = 0.82) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Prefer image/webp if supported, else fallback to image/jpeg
          try {
            const dataUrl = canvas.toDataURL('image/webp', quality);
            resolve(dataUrl);
          } catch (err) {
            resolve(canvas.toDataURL('image/jpeg', quality));
          }
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ==========================================================================
  // BACKUP, EXPORT & RESET
  // ==========================================================================

  window.exportEventsJsFile = function() {
    const fileContent = EventsStore.generateRegistryJs();
    downloadFile(fileContent, 'events-data.js', 'text/javascript');
    showToast('Downloaded events-data.js! Replace assets/events/events-data.js to commit.', 'success');
  };

  window.exportBackupJsonFile = function() {
    const backupStr = EventsStore.exportBackupJson();
    const filename = `sarvahita-backup-${new Date().toISOString().slice(0,10)}.json`;
    downloadFile(backupStr, filename, 'application/json');
    showToast('Full JSON backup downloaded.', 'success');
  };

  window.importBackupJsonFile = function(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      const success = EventsStore.importBackupJson(e.target.result);
      if (success) {
        refreshAllData();
        showToast('Backup restored successfully!', 'success');
      } else {
        alert('Invalid backup JSON format.');
      }
    };
    reader.readAsText(file);
    fileInput.value = '';
  };

  window.resetAllDefaults = function() {
    if (confirm('WARNING: Are you sure you want to reset all data back to original defaults? Any custom events or uploaded photos in this browser will be cleared.')) {
      EventsStore.resetToDefaults();
      refreshAllData();
      showToast('Reset back to factory defaults.', 'info');
    }
  };

  function downloadFile(content, fileName, contentType) {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Toast Notification
  function showToast(message, type = 'info') {
    const toast = document.getElementById('adminToast');
    if (!toast) return;

    toast.className = `admin-toast show ${type}`;
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

})();
