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

  const volunteerForm = document.getElementById('volunteerForm');
  if (volunteerForm) {
    volunteerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (volunteerModal) volunteerModal.classList.remove('active');
      showToast('🌟 Thank you for applying to be a founding volunteer! Our team will contact you soon.');
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
