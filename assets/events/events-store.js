/**
 * SAVING SARVAHITA FOUNDATION - Events & Media Store
 * Centralized client-side persistence bridging default static data with dynamic Admin changes.
 */

(function() {
  const STORAGE_KEY_EVENTS = 'sarvahita_events_data';
  const STORAGE_KEY_UPCOMING = 'sarvahita_upcoming_events';
  const STORAGE_KEY_AUTH = 'sarvahita_admin_auth';
  const STORAGE_KEY_PASS = 'sarvahita_admin_pass';

  // Default Upcoming Event if none configured yet
  const DEFAULT_UPCOMING_EVENTS = [
    {
      id: 'upcoming-animal-feeding-dahisar',
      title: 'Sarva Jeev Raksha: Street Animal Feeding & Compassion Drive',
      badge: 'Upcoming This Week',
      dateText: 'This Week',
      dateFull: 'Sunday Morning Drive',
      location: 'Dahisar & Mumbai Suburbs',
      category: 'hunger-support',
      categoryName: 'Sarva Jeev Raksha',
      categoryIcon: 'fa-paw',
      badgeColor: 'linear-gradient(135deg, #16A34A, #059669)',
      tagBg: 'rgba(22, 163, 74, 0.12)',
      tagColor: '#16A34A',
      image: 'assets/events/animal-feeding-16-aug-2026/animal-feeding-01.webp',
      desc: 'Join our team this week as we distribute freshly prepared nutritious meals, milk, biscuits, and basic medical care to stray dogs and cats across local street pockets.',
      targetMetric1: '100+ Meals Planned',
      targetMetric2: 'Open Volunteers',
      status: 'active'
    }
  ];

  // Helper for natural string sorting
  function naturalSort(a, b) {
    return (a || '').localeCompare(b || '', undefined, { numeric: true, sensitivity: 'base' });
  }

  const EventsStore = {
    // Check if customized data exists
    hasCustomData: function() {
      return !!localStorage.getItem(STORAGE_KEY_EVENTS);
    },

    // Get all completed events
    getEvents: function() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_EVENTS);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading events from storage:', e);
      }

      // Fallback to static window.SAVING_SARVAHITA_EVENTS
      if (window.SAVING_SARVAHITA_EVENTS && Array.isArray(window.SAVING_SARVAHITA_EVENTS.events)) {
        return JSON.parse(JSON.stringify(window.SAVING_SARVAHITA_EVENTS.events));
      }
      return [];
    },

    // Save completed events array
    saveEvents: function(events) {
      // Keep events sorted newest first
      events.sort((a, b) => (b.sortDate || '').localeCompare(a.sortDate || ''));
      localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
      this.dispatchUpdate();
      return events;
    },

    // Get Upcoming Events
    getUpcomingEvents: function() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_UPCOMING);
        if (stored) {
          return JSON.parse(stored);
        }
      } catch (e) {
        console.error('Error reading upcoming events from storage:', e);
      }
      return JSON.parse(JSON.stringify(DEFAULT_UPCOMING_EVENTS));
    },

    // Save Upcoming Events
    saveUpcomingEvents: function(upcoming) {
      localStorage.setItem(STORAGE_KEY_UPCOMING, JSON.stringify(upcoming));
      this.dispatchUpdate();
      return upcoming;
    },

    // Add or Update a Completed Event
    saveEvent: function(eventData) {
      const events = this.getEvents();
      if (!eventData.id) {
        eventData.id = 'event-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
      }

      // Ensure media array exists
      if (!Array.isArray(eventData.media)) {
        eventData.media = [];
      }
      eventData.imageCount = eventData.media.length;
      eventData.totalCount = eventData.media.length;
      if (!eventData.coverMedia && eventData.media.length > 0) {
        eventData.coverMedia = eventData.media[0];
      }

      const existingIndex = events.findIndex(e => e.id === eventData.id);
      if (existingIndex >= 0) {
        events[existingIndex] = Object.assign({}, events[existingIndex], eventData);
      } else {
        events.unshift(eventData);
      }

      this.saveEvents(events);
      return eventData;
    },

    // Delete a Completed Event
    deleteEvent: function(eventId) {
      let events = this.getEvents();
      events = events.filter(e => e.id !== eventId);
      this.saveEvents(events);
      return true;
    },

    // Add or Update Upcoming Event
    saveUpcomingItem: function(item) {
      const list = this.getUpcomingEvents();
      if (!item.id) {
        item.id = 'upcoming-' + Date.now().toString(36);
      }
      const existingIndex = list.findIndex(e => e.id === item.id);
      if (existingIndex >= 0) {
        list[existingIndex] = Object.assign({}, list[existingIndex], item);
      } else {
        list.unshift(item);
      }
      this.saveUpcomingEvents(list);
      return item;
    },

    // Change status of an event (switch seamlessly between 'upcoming' and 'completed')
    changeStatus: function(id, targetStatus) {
      if (targetStatus === 'completed') {
        const upcomingList = this.getUpcomingEvents();
        const item = upcomingList.find(u => u.id === id);
        if (item) {
          this.saveUpcomingEvents(upcomingList.filter(u => u.id !== id));
          const today = new Date();
          const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          const day = String(today.getDate()).padStart(2, '0');
          const month = monthNames[today.getMonth()];
          const year = String(today.getFullYear());
          const dateStr = `${day} ${month} ${year}`;
          const dateFull = `${day} ${fullMonthNames[today.getMonth()]} ${year}`;
          const sortDate = today.toISOString().slice(0, 10);

          const newEvent = {
            id: 'event-' + (item.id.replace('upcoming-', '')),
            title: item.title,
            subtitle: item.desc ? item.desc.slice(0, 80) + '...' : 'On-ground field drive by volunteers',
            date: dateStr,
            dateFull: dateFull,
            day: day,
            month: month,
            year: year,
            sortDate: sortDate,
            category: item.category || 'hunger-support',
            categoryName: item.categoryName || 'Community Drive',
            categoryIcon: item.categoryIcon || 'fa-paw',
            badgeColor: item.badgeColor || 'linear-gradient(135deg, #16A34A, #059669)',
            tagBg: item.tagBg || 'rgba(22, 163, 74, 0.12)',
            tagColor: item.tagColor || '#16A34A',
            location: item.location || 'Mumbai, Maharashtra',
            desc: item.desc || 'Drive successfully completed by our team.',
            beneficiaries: item.targetMetric1 || '100+ Beneficiaries',
            media: item.image ? [{
              id: 'media-' + Date.now().toString(36),
              type: 'image',
              src: item.image,
              filename: 'banner.webp',
              title: item.title,
              desc: item.location
            }] : [],
            coverMedia: null,
            imageCount: item.image ? 1 : 0,
            status: 'completed'
          };
          if (newEvent.media.length > 0) newEvent.coverMedia = newEvent.media[0];
          this.saveEvent(newEvent);
          return newEvent;
        }
      } else if (targetStatus === 'upcoming') {
        const completedEvents = this.getEvents();
        const ev = completedEvents.find(e => e.id === id);
        if (ev) {
          this.saveEvents(completedEvents.filter(e => e.id !== id));
          const upcomingItem = {
            id: 'upcoming-' + (ev.id.replace('event-', '')),
            title: ev.title,
            badge: 'Upcoming Drive',
            dateText: 'Planned Soon',
            category: ev.category || 'hunger-support',
            categoryName: ev.categoryName || 'Community Drive',
            categoryIcon: ev.categoryIcon || 'fa-paw',
            location: ev.location || 'Mumbai, Maharashtra',
            targetMetric1: ev.beneficiaries || 'Target Planned',
            targetMetric2: 'Volunteers Welcome',
            desc: ev.desc || 'Upcoming field initiative organized by Saving Sarvahita Foundation.',
            image: (ev.coverMedia && ev.coverMedia.src) ? ev.coverMedia.src : (ev.media && ev.media[0] ? ev.media[0].src : ''),
            status: 'upcoming'
          };
          this.saveUpcomingItem(upcomingItem);
          return upcomingItem;
        }
      }
      return null;
    },

    // Delete Upcoming Event
    deleteUpcomingItem: function(id) {
      let list = this.getUpcomingEvents();
      list = list.filter(e => e.id !== id);
      this.saveUpcomingEvents(list);
      return true;
    },

    // Add Photo to Event
    addPhotoToEvent: function(eventId, photoObj) {
      const events = this.getEvents();
      const event = events.find(e => e.id === eventId);
      if (!event) return false;

      if (!Array.isArray(event.media)) event.media = [];
      
      const newPhoto = {
        id: photoObj.id || ('media-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 4)),
        type: 'image',
        src: photoObj.src,
        filename: photoObj.filename || 'uploaded-photo.webp',
        title: photoObj.title || (event.title + ' Moment'),
        desc: photoObj.desc || 'On-ground field drive photo capture'
      };

      event.media.push(newPhoto);
      event.imageCount = event.media.length;
      event.totalCount = event.media.length;
      if (!event.coverMedia) {
        event.coverMedia = newPhoto;
      }

      this.saveEvents(events);
      return newPhoto;
    },

    // Delete Photo from Event
    deletePhotoFromEvent: function(eventId, photoId) {
      const events = this.getEvents();
      const event = events.find(e => e.id === eventId);
      if (!event || !Array.isArray(event.media)) return false;

      event.media = event.media.filter(m => m.id !== photoId);
      event.imageCount = event.media.length;
      event.totalCount = event.media.length;

      if (event.coverMedia && event.coverMedia.id === photoId) {
        event.coverMedia = event.media[0] || null;
      }

      this.saveEvents(events);
      return true;
    },

    // Set Cover Photo
    setCoverPhoto: function(eventId, photoId) {
      const events = this.getEvents();
      const event = events.find(e => e.id === eventId);
      if (!event || !Array.isArray(event.media)) return false;

      const photo = event.media.find(m => m.id === photoId);
      if (photo) {
        event.coverMedia = photo;
        this.saveEvents(events);
        return true;
      }
      return false;
    },

    // Total Stats
    getStats: function() {
      const events = this.getEvents();
      const upcoming = this.getUpcomingEvents();
      let totalPhotos = 0;
      events.forEach(e => {
        totalPhotos += (e.media ? e.media.length : (e.imageCount || 0));
      });
      return {
        totalDrives: events.length,
        totalPhotos: totalPhotos,
        totalUpcoming: upcoming.length
      };
    },

    // Export Registry Javascript content for assets/events/events-data.js
    generateRegistryJs: function() {
      const events = this.getEvents();
      let totalPhotos = 0;
      events.forEach(e => {
        totalPhotos += (e.media ? e.media.length : 0);
      });

      const registry = {
        generatedAt: new Date().toISOString(),
        stats: {
          totalDrives: events.length,
          totalPhotos: totalPhotos,
          totalVideos: 0,
          totalMedia: totalPhotos
        },
        events: events
      };

      const jsonStr = JSON.stringify(registry, null, 2);
      return `/**\n * Saving Sarvahita Foundation - Dynamic Events & Gallery Registry\n * Exported from Admin Portal on: ${new Date().toLocaleString()}\n */\nwindow.SAVING_SARVAHITA_EVENTS = ${jsonStr};\nif (typeof module !== 'undefined' && module.exports) {\n  module.exports = window.SAVING_SARVAHITA_EVENTS;\n}\n`;
    },

    // Export complete backup JSON
    exportBackupJson: function() {
      return JSON.stringify({
        version: '1.0',
        exportedAt: new Date().toISOString(),
        events: this.getEvents(),
        upcomingEvents: this.getUpcomingEvents()
      }, null, 2);
    },

    // Import backup JSON
    importBackupJson: function(jsonString) {
      try {
        const parsed = JSON.parse(jsonString);
        if (Array.isArray(parsed.events)) {
          this.saveEvents(parsed.events);
        }
        if (Array.isArray(parsed.upcomingEvents)) {
          this.saveUpcomingEvents(parsed.upcomingEvents);
        }
        return true;
      } catch (err) {
        console.error('Import failed:', err);
        return false;
      }
    },

    // Reset back to factory defaults
    resetToDefaults: function() {
      localStorage.removeItem(STORAGE_KEY_EVENTS);
      localStorage.removeItem(STORAGE_KEY_UPCOMING);
      this.dispatchUpdate();
      return true;
    },

    // Notify other components or tabs
    dispatchUpdate: function() {
      window.dispatchEvent(new CustomEvent('sarvahita-data-updated'));
    }
  };

  // Expose to window
  window.EventsStore = EventsStore;
})();
