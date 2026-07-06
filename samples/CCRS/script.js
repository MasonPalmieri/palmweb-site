/* ============================================
   CCRS — interactions: nav, reveal, form mailto
   ============================================ */

// Mobile menu toggle
const toggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => navLinks.classList.remove('open'))
  );
}

// Reveal-on-scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ---- Contact form (mailto fallback for static demo) ----
function handleContactForm(form, recipient) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const role = data.get('role') || 'Inquiry';
    const name = data.get('name') || '';
    const email = data.get('email') || '';
    const phone = data.get('phone') || '';
    const org = data.get('organization') || '';
    const message = data.get('message') || '';

    const subject = `[CCRS] ${role} inquiry — ${name}`;
    const body =
`Role: ${role}
Name: ${name}
Email: ${email}
Phone: ${phone}
Organization / Practice: ${org}

Message:
${message}

— Submitted from recoverwithccrs.com`;

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const success = form.querySelector('.form-success');
    if (success) success.classList.add('show');
  });
}

const contactForm = document.getElementById('contact-form');
if (contactForm) handleContactForm(contactForm, 'contact@recoverwithccrs.com');

// ---- Patient feedback survey (POST to portal) ----
const SURVEY_ENDPOINT = 'https://ccrs-admin.onrender.com/api/feedback/submit';
const FEEDBACK_LOOKUP_ENDPOINT = 'https://ccrs-admin.onrender.com/api/feedback/link/';

const surveyForm = document.getElementById('survey-form');
if (surveyForm) {
  // If URL has ?t=<token>, verify + pre-fill patient info
  const params = new URLSearchParams(window.location.search);
  const surveyToken = params.get('t');

  if (surveyToken) {
    fetch(FEEDBACK_LOOKUP_ENDPOINT + encodeURIComponent(surveyToken))
      .then((r) => r.json())
      .then((data) => {
        if (data && data.valid && data.patient) {
          const p = data.patient;
          const nameInput = surveyForm.querySelector('#p_name');
          const emailInput = surveyForm.querySelector('#p_email');
          const phoneInput = surveyForm.querySelector('#p_phone');
          const procedureInput = surveyForm.querySelector('#procedure');
          const surgeryInput = surveyForm.querySelector('#surgery_date');
          if (nameInput && !nameInput.value) nameInput.value = `${p.firstName || ''} ${p.lastName || ''}`.trim();
          if (emailInput && p.email) emailInput.value = p.email;
          if (phoneInput && p.phone) phoneInput.value = p.phone;
          if (procedureInput && p.procedure) procedureInput.value = p.procedure;
          if (surgeryInput && p.surgeryDate) surgeryInput.value = p.surgeryDate;
        } else if (data && data.used) {
          const banner = document.createElement('div');
          banner.style.cssText = 'background:#fef3c7;border:1px solid #f59e0b;color:#78350f;padding:12px 16px;border-radius:8px;margin-bottom:16px;font-size:0.95rem;';
          banner.textContent = 'This survey has already been submitted. Thank you.';
          surveyForm.parentNode.insertBefore(banner, surveyForm);
          surveyForm.style.display = 'none';
        }
      })
      .catch(() => { /* silent — fall back to standalone submit */ });
  }

  surveyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(surveyForm);
    const payload = {
      token: surveyToken || null,
      p_name: data.get('p_name') || null,
      p_email: data.get('p_email') || null,
      p_phone: data.get('p_phone') || null,
      procedure: data.get('procedure') || null,
      surgery_date: data.get('surgery_date') || null,
      provider: data.get('provider') || null,
      overall: data.get('overall') || null,
      setup: data.get('setup') || null,
      comfort: data.get('comfort') || null,
      relief: data.get('relief') || null,
      support: data.get('support') || null,
      reduced_meds: data.get('reduced_meds') || null,
      recommend: data.get('recommend') || null,
      comments: data.get('comments') || null,
      consent: data.get('consent') ? 'yes' : null,
    };

    const submitBtn = surveyForm.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = 'Submitting…'; }

    try {
      const res = await fetch(SURVEY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `Server returned ${res.status}`);
      }
      const success = surveyForm.querySelector('.form-success');
      if (success) {
        success.textContent = 'Thank you — your feedback has been received. The CCRS team will review it shortly.';
        success.classList.add('show');
      }
      surveyForm.reset();
      surveyForm.style.display = 'none';
      window.scrollTo({ top: (surveyForm.offsetTop || 0) - 100, behavior: 'smooth' });
    } catch (err) {
      alert('Could not submit feedback: ' + (err && err.message ? err.message : 'network error') + '\n\nPlease try again, or email contact@recoverwithccrs.com directly.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalLabel; }
    }
  });
}

// ---- Rental inquiry form ----
const rentalForm = document.getElementById('rental-form');
if (rentalForm) {
  // Auto-format phone number as (XXX) XXX-XXXX while typing
  const phoneInput = rentalForm.querySelector('input[name="phone"]');
  if (phoneInput) {
    const formatPhone = (raw) => {
      const d = (raw || '').replace(/\D/g, '').slice(0, 10);
      if (d.length === 0) return '';
      if (d.length < 4) return `(${d}`;
      if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
    };
    phoneInput.addEventListener('input', (e) => {
      const before = e.target.value;
      const caretAtEnd = e.target.selectionStart === before.length;
      const formatted = formatPhone(before);
      if (formatted !== before) {
        e.target.value = formatted;
        if (caretAtEnd) {
          e.target.setSelectionRange(formatted.length, formatted.length);
        }
      }
    });
    phoneInput.addEventListener('blur', (e) => {
      e.target.value = formatPhone(e.target.value);
    });
  }

  // Live update of the "selected duration" readout
  const readout = document.getElementById('readout-duration');
  document.querySelectorAll('input[name="duration_choice"]').forEach(r => {
    r.addEventListener('change', () => {
      if (readout) readout.textContent = r.value;
    });
  });

  // Formspree endpoint — set data-formspree="https://formspree.io/f/XXXX" on the <form> to enable AJAX submit.
  // Falls back to mailto: if no endpoint is configured.
  const FORMSPREE_ENDPOINT = rentalForm.dataset.formspree || '';
  const RECIPIENT = 'contact@recoverwithccrs.com';

  function buildRentalPayload(data, chosen) {
    const lines = [];
    lines.push('CCRS — NICE1 Rental Inquiry');
    lines.push('================================');
    lines.push('');
    lines.push(`Submitted: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('— Patient —');
    lines.push(`Name: ${data.get('first_name') || ''} ${data.get('last_name') || ''}`);
    lines.push(`Date of Birth: ${data.get('dob') || '(not provided)'}`);
    lines.push(`Email: ${data.get('email') || '(not provided)'}`);
    lines.push(`Phone: ${data.get('phone') || '(not provided)'}`);
    lines.push(`Preferred contact: ${data.get('contact_method') || '(not provided)'}`);
    lines.push('');
    lines.push('— Delivery address —');
    lines.push(`${data.get('address_street') || ''}`);
    lines.push(`${data.get('address_city') || ''}, ${(data.get('address_state') || '').toUpperCase()} ${data.get('address_zip') || ''}`);
    lines.push(`Address verified by patient: ${data.get('address_verify') ? 'Yes' : 'No'}`);
    lines.push('');
    lines.push('— Procedure —');
    lines.push(`Surgery date: ${data.get('surgery_date') || '(not provided)'}`);
    const bodyPart = data.get('injury_type') || '(not provided)';
    const bodySide = data.get('body_side');
    lines.push(`Body part: ${bodyPart}${bodySide ? ` (${bodySide})` : ''}`);
    lines.push(`Procedure: ${data.get('procedure') || '(not provided)'}`);
    lines.push(`Physician: ${data.get('physician_name') || '(not provided)'}`);
    lines.push('');
    lines.push('— Rental selection —');
    lines.push(`Duration: ${chosen.value}`);
    lines.push(`Delivery: TBD (variable — confirm with patient)`);
    lines.push('');
    lines.push('— Notes —');
    lines.push(data.get('notes') || '(none)');
    lines.push('');
    lines.push('— Reminder —');
    lines.push('No payment was collected. Confirm final pricing + delivery with patient before charging.');
    lines.push('');
    lines.push('— Submitted from recoverwithccrs.com/rental —');
    return lines.join('\n');
  }

  function showSuccess() {
    const success = rentalForm.querySelector('.form-success');
    if (success) success.classList.add('show');
    rentalForm.style.display = 'none';
    window.scrollTo({ top: (rentalForm.offsetTop || 0) - 100, behavior: 'smooth' });
  }

  function showError(msg, mailtoUrl) {
    let err = rentalForm.querySelector('.form-error');
    if (!err) {
      err = document.createElement('div');
      err.className = 'form-error show';
      rentalForm.insertBefore(err, rentalForm.firstChild);
    }
    err.classList.add('show');
    err.innerHTML = `${msg} <a href="${mailtoUrl}" style="color:inherit; text-decoration:underline; font-weight:600;">Click here to email us directly →</a>`;
    window.scrollTo({ top: (rentalForm.offsetTop || 0) - 100, behavior: 'smooth' });
  }

  rentalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Require a duration choice (it's outside the form so .required doesn't catch it)
    const chosen = document.querySelector('input[name="duration_choice"]:checked');
    if (!chosen) {
      alert('Please choose a rental duration above before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Basic required-field check (form has novalidate; do it manually so submit always feels responsive)
    const requiredFields = ['first_name', 'last_name', 'dob', 'phone', 'address_street', 'address_city', 'address_state', 'address_zip', 'surgery_date', 'injury_type', 'physician_name'];
    const data = new FormData(rentalForm);
    for (const f of requiredFields) {
      if (!data.get(f)) {
        const el = rentalForm.querySelector(`[name="${f}"]`);
        if (el) el.focus();
        alert(`Please fill in the required field: ${f.replace(/_/g, ' ')}`);
        return;
      }
    }
    if (!data.get('address_verify')) {
      alert('Please confirm your delivery address by checking the box above.');
      return;
    }
    if (!data.get('contact_method')) {
      alert('Please choose how we should reach you.');
      return;
    }

    const submitBtn = rentalForm.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    // Fire-and-forget: send to CCRS admin portal so the inquiry always lands in the staff dashboard,
    // independent of Formspree/mailto. Runs in parallel; we don't await it or block the UX.
    (function postToPortal() {
      try {
        const portalPayload = {};
        for (const [k, v] of data.entries()) portalPayload[k] = v;
        portalPayload.duration_choice = chosen.value;
        fetch('https://ccrs-admin.onrender.com/api/webhooks/rental-inquiry', {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            'X-CCRS-Webhook-Secret': 'ccrs-web-form-2026',
          },
          body: JSON.stringify(portalPayload),
          keepalive: true,
        }).catch((err) => console.warn('Portal webhook failed (non-blocking):', err));
      } catch (err) {
        console.warn('Portal webhook prep failed:', err);
      }
    })();

    const subject = `[CCRS Rental] NICE1 ${chosen.dataset.label || ''} — ${data.get('first_name') || ''} ${data.get('last_name') || ''}`;
    const body = buildRentalPayload(data, chosen);
    const mailtoUrl = `mailto:${RECIPIENT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Path A: Formspree AJAX (preferred — works on all devices, no mail client needed)
    if (FORMSPREE_ENDPOINT) {
      try {
        const payload = new FormData();
        for (const [k, v] of data.entries()) payload.append(k, v);
        payload.append('duration_choice', chosen.value);
        payload.append('_subject', subject);
        payload.append('_replyto', data.get('email') || '');
        payload.append('summary', body);

        const res = await fetch(FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: payload,
        });
        if (res.ok) {
          showSuccess();
          return;
        }
        throw new Error(`Formspree returned ${res.status}`);
      } catch (err) {
        console.error('Formspree submit failed:', err);
        showError('We couldn\'t submit your inquiry automatically.', mailtoUrl);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Rental Inquiry'; }
        return;
      }
    }

    // Path B: mailto fallback (opens user's mail client)
    showSuccess();
    // Try mailto after showing success so the confirmation stays visible even if mailto fails
    setTimeout(() => { window.location.href = mailtoUrl; }, 250);
  });
}

// ---- Active nav highlighting based on path ----
(() => {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href && (href === path || (path === '' && href === 'index.html'))) {
      a.classList.add('active');
    }
  });
})();
