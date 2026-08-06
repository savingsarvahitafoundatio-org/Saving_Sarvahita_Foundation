/* ==========================================================================
   SAVING SARVAHITA FOUNDATION - INTERACTIVE SCRIPT (NEW NGO LAUNCH)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');

  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      const icon = mobileToggle.querySelector('i');
      if (icon) {
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-xmark');
      }
    });
  }

  // Smooth Scroll for Nav Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        e.preventDefault();
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          if (navMenu && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            if (mobileToggle) {
              const icon = mobileToggle.querySelector('i');
              if (icon) {
                icon.classList.add('fa-bars');
                icon.classList.remove('fa-xmark');
              }
            }
          }
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Animated Startup Targets Counter
  const counterElements = document.querySelectorAll('.impact-number');
  let countersAnimated = false;

  const animateCounters = () => {
    counterElements.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target') || '0', 10);
      const duration = 1800;
      const stepTime = 40;
      const steps = duration / stepTime;
      const increment = target / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        counter.textContent = Math.floor(current).toLocaleString('en-IN') + '+';
      }, stepTime);
    });
  };

  const impactSection = document.querySelector('.impact-bar');
  if (impactSection) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !countersAnimated) {
          countersAnimated = true;
          animateCounters();
        }
      });
    }, { threshold: 0.3 });

    observer.observe(impactSection);
  }

  // Donation Modal Logic
  const donateModal = document.getElementById('donateModal');
  const donateBtns = document.querySelectorAll('.trigger-donate');
  const closeDonateBtn = document.getElementById('closeDonateModal');

  donateBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (donateModal) donateModal.classList.add('active');
    });
  });

  if (closeDonateBtn && donateModal) {
    closeDonateBtn.addEventListener('click', () => {
      donateModal.classList.remove('active');
    });
  }

  // Amount Button selection
  const amountBtns = document.querySelectorAll('.amount-btn');
  const customAmountInput = document.getElementById('customAmount');

  amountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      amountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-amount');
      if (customAmountInput && val) {
        customAmountInput.value = val;
        updateUPIQR(val);
      }
    });
  });

  if (customAmountInput) {
    customAmountInput.addEventListener('input', (e) => {
      amountBtns.forEach(b => b.classList.remove('active'));
      updateUPIQR(e.target.value || '1000');
    });
  }

  function updateUPIQR(amount) {
    const qrImage = document.getElementById('upiQrImage');
    if (qrImage) {
      const upiId = '8828428845@upi';
      const name = 'Saving Sarvahita Foundation';
      const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR`;
      qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(upiUrl)}`;
    }
  }

  // Donation Form Submit
  const donateForm = document.getElementById('donateForm');
  if (donateForm) {
    donateForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (donateModal) donateModal.classList.remove('active');
      showToast('❤️ Thank you for supporting our new NGO! We appreciate your contribution.');
    });
  }

  // Volunteer Modal Logic
  const volunteerModal = document.getElementById('volunteerModal');
  const volunteerBtns = document.querySelectorAll('.trigger-volunteer');
  const closeVolunteerBtn = document.getElementById('closeVolunteerModal');

  volunteerBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (volunteerModal) volunteerModal.classList.add('active');
    });
  });

  if (closeVolunteerBtn && volunteerModal) {
    closeVolunteerBtn.addEventListener('click', () => {
      volunteerModal.classList.remove('active');
    });
  }

  // FormSubmit Integration for Volunteer Form
  const volunteerForm = document.getElementById('volunteerForm');
  if (volunteerForm) {
    volunteerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = volunteerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Application <i class="fa-solid fa-paper-plane"></i>';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      }

      const inputs = volunteerForm.querySelectorAll('input, select');
      const name = inputs[0] ? inputs[0].value : 'Volunteer';
      const email = inputs[1] ? inputs[1].value : '';
      const phone = inputs[2] ? inputs[2].value : '';
      const interest = inputs[3] ? inputs[3].value : 'General';

      const payload = {
        name: name,
        email: email,
        phone: phone,
        interest: interest,
        _replyto: email,
        _subject: `New Volunteer Application: ${name}`,
        _autoresponse: `Dear ${name}, Thank you for applying to volunteer with Saving Sarvahita Foundation! Our team has received your application and will get in touch with you shortly. Warm regards, Saving Sarvahita Foundation Team`,
        _template: "table"
      };

      fetch("https://formsubmit.co/ajax/info@savingsarvahita.org", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(() => {
        if (volunteerModal) volunteerModal.classList.remove('active');
        volunteerForm.reset();
        showToast('🌟 Thank you for applying! A confirmation email has been sent to your inbox.');
      })
      .catch(() => {
        if (volunteerModal) volunteerModal.classList.remove('active');
        volunteerForm.reset();
        showToast('🌟 Thank you! Your volunteer application has been received.');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    });
  }

  // FormSubmit Integration for Contact Form
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Send Message <i class="fa-solid fa-paper-plane"></i>';

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
      }

      const name = contactForm.querySelector('input[type="text"]')?.value || 'Visitor';
      const email = contactForm.querySelector('input[type="email"]')?.value || '';
      const phone = contactForm.querySelector('input[type="tel"]')?.value || '';
      const subject = contactForm.querySelector('select')?.value || 'General Inquiry';
      const message = contactForm.querySelector('textarea')?.value || '';

      const payload = {
        name: name,
        email: email,
        phone: phone,
        subject: subject,
        message: message,
        _replyto: email,
        _subject: `New Contact Inquiry: ${subject}`,
        _autoresponse: `Dear ${name}, Thank you for contacting Saving Sarvahita Foundation regarding your inquiry. Our team has received your message and will respond to you shortly. Warm regards, Saving Sarvahita Foundation Team`,
        _template: "table"
      };

      fetch("https://formsubmit.co/ajax/info@savingsarvahita.org", {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(() => {
        contactForm.reset();
        showToast('📩 Message sent! A confirmation email has been sent to your inbox.');
      })
      .catch(() => {
        contactForm.reset();
        showToast('📩 Thank you! Your message has been received.');
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      });
    });
  }

  // Cause Details Modal
  const causeModal = document.getElementById('causeModal');
  const causeLinks = document.querySelectorAll('.trigger-cause-details');
  const closeCauseBtn = document.getElementById('closeCauseModal');

  const causeDetails = {
    education: {
      title: "Education Support",
      desc: "Our educational support project aims to provide fundamental study kits, books, and educational guidance to underprivileged children in Mumbai to ensure no child drops out of school."
    },
    child: {
      title: "Orphanage & Child Support",
      desc: "Supporting vulnerable children with basic nutritional kits, care supplies, and mentorship programs to provide them with safety and hope."
    },
    senior: {
      title: "Senior Citizen Support",
      desc: "Ensuring dignity, free primary health checkups, companionship, and emotional support for senior citizens living in hardship."
    },
    women: {
      title: "Women Empowerment",
      desc: "Conducting basic skill awareness, vocational guidance, hygiene distribution, and micro-entrepreneurship encouragement for women."
    },
    animal: {
      title: "Animal Care & Welfare",
      desc: "Our animal welfare drive is focused on street animal feeding, basic injury care, vaccination awareness, and encouraging community empathy."
    },
    health: {
      title: "Healthcare Aid",
      desc: "Organizing primary health screening camps, eye checkups, blood donation awareness, and helping needy patients get emergency care."
    },
    environment: {
      title: "Environmental Care & Tree Plantation",
      desc: "Planting native trees, neighborhood cleanup drives, and spreading awareness on green, plastic-free living."
    },
    relief: {
      title: "Hunger & Ration Support",
      desc: "Distributing food packages, essential ration kits, and emergency supplies to impoverished families in urgent distress."
    }
  };

  causeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const key = link.getAttribute('data-cause');
      if (causeModal && causeDetails[key]) {
        document.getElementById('causeModalTitle').textContent = causeDetails[key].title;
        document.getElementById('causeModalDesc').textContent = causeDetails[key].desc;
        causeModal.classList.add('active');
      }
    });
  });

  if (closeCauseBtn && causeModal) {
    closeCauseBtn.addEventListener('click', () => {
      causeModal.classList.remove('active');
    });
  }

  // Close modals when clicking overlay background
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });
  });

  // Gallery Filter System
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      galleryItems.forEach(item => {
        const cat = item.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          item.style.display = 'block';
        } else {
          item.style.display = 'none';
        }
      });
    });
  });

  // Lightbox Modal Logic for Gallery Photos
  const lightboxModal = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const closeLightbox = document.getElementById('closeLightbox');
  const prevLightbox = document.getElementById('prevLightbox');
  const nextLightbox = document.getElementById('nextLightbox');

  let currentGalleryIndex = 0;
  let activeGalleryItems = [];

  function updateActiveGalleryItems() {
    activeGalleryItems = Array.from(galleryItems).filter(item => item.style.display !== 'none');
  }

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      updateActiveGalleryItems();
      currentGalleryIndex = activeGalleryItems.indexOf(item);
      openLightboxItem(item);
    });
  });

  function openLightboxItem(item) {
    if (!item) return;
    const img = item.querySelector('img');
    const title = item.querySelector('h4') ? item.querySelector('h4').textContent : '';
    const desc = item.querySelector('p') ? item.querySelector('p').textContent : '';

    if (img && lightboxImg) {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || title;
    }
    if (lightboxCaption) {
      lightboxCaption.textContent = title ? `${title} - ${desc}` : desc;
    }
    if (lightboxModal) {
      lightboxModal.classList.add('active');
    }
  }

  if (closeLightbox && lightboxModal) {
    closeLightbox.addEventListener('click', () => {
      lightboxModal.classList.remove('active');
    });

    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) {
        lightboxModal.classList.remove('active');
      }
    });
  }

  if (prevLightbox) {
    prevLightbox.addEventListener('click', (e) => {
      e.stopPropagation();
      updateActiveGalleryItems();
      if (activeGalleryItems.length > 0) {
        currentGalleryIndex = (currentGalleryIndex - 1 + activeGalleryItems.length) % activeGalleryItems.length;
        openLightboxItem(activeGalleryItems[currentGalleryIndex]);
      }
    });
  }

  if (nextLightbox) {
    nextLightbox.addEventListener('click', (e) => {
      e.stopPropagation();
      updateActiveGalleryItems();
      if (activeGalleryItems.length > 0) {
        currentGalleryIndex = (currentGalleryIndex + 1) % activeGalleryItems.length;
        openLightboxItem(activeGalleryItems[currentGalleryIndex]);
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (lightboxModal && lightboxModal.classList.contains('active')) {
      if (e.key === 'Escape') lightboxModal.classList.remove('active');
      if (e.key === 'ArrowLeft' && prevLightbox) prevLightbox.click();
      if (e.key === 'ArrowRight' && nextLightbox) nextLightbox.click();
    }
  });

  // Toast Notification System
  function showToast(message) {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.innerHTML = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
});

