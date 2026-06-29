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

// ---- Patient feedback survey (mailto for demo; backend later) ----
const surveyForm = document.getElementById('survey-form');
if (surveyForm) {
  surveyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(surveyForm);

    const lines = [];
    lines.push('CCRS Patient Feedback Survey');
    lines.push('================================');
    lines.push('');
    lines.push(`Submitted: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('— Patient Information —');
    lines.push(`Name: ${data.get('p_name') || '(not provided)'}`);
    lines.push(`Email: ${data.get('p_email') || '(not provided)'}`);
    lines.push(`Phone: ${data.get('p_phone') || '(not provided)'}`);
    lines.push(`Procedure / Surgery: ${data.get('procedure') || '(not provided)'}`);
    lines.push(`Surgery Date: ${data.get('surgery_date') || '(not provided)'}`);
    lines.push(`Provider / Practice: ${data.get('provider') || '(not provided)'}`);
    lines.push('');
    lines.push('— Experience Ratings (1=Poor, 5=Excellent) —');
    lines.push(`Overall experience: ${data.get('overall') || '-'}`);
    lines.push(`Ease of setup: ${data.get('setup') || '-'}`);
    lines.push(`Comfort during use: ${data.get('comfort') || '-'}`);
    lines.push(`Pain relief effectiveness: ${data.get('relief') || '-'}`);
    lines.push(`CCRS support & service: ${data.get('support') || '-'}`);
    lines.push('');
    lines.push('— Outcomes —');
    lines.push(`Reduced pain medication use: ${data.get('reduced_meds') || '-'}`);
    lines.push(`Would recommend to others: ${data.get('recommend') || '-'}`);
    lines.push('');
    lines.push('— Comments —');
    lines.push(data.get('comments') || '(none)');
    lines.push('');
    lines.push('— Consent —');
    lines.push(`Consent to use as testimonial: ${data.get('consent') ? 'Yes' : 'No'}`);

    const subject = `[CCRS Survey] Feedback from ${data.get('p_name') || 'Patient'}`;
    const body = lines.join('\n');

    // For demo: open mail client with prefilled message.
    window.location.href = `mailto:contact@recoverwithccrs.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const success = surveyForm.querySelector('.form-success');
    if (success) success.classList.add('show');
    surveyForm.reset();
    window.scrollTo({ top: surveyForm.offsetTop - 100, behavior: 'smooth' });
  });
}

// ---- Rental inquiry form ----
const rentalForm = document.getElementById('rental-form');
if (rentalForm) {
  // Live update of the "selected duration" readout
  const readout = document.getElementById('readout-duration');
  document.querySelectorAll('input[name="duration_choice"]').forEach(r => {
    r.addEventListener('change', () => {
      if (readout) readout.textContent = r.value;
    });
  });

  rentalForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Require a duration choice (it's outside the form so .required doesn't catch it)
    const chosen = document.querySelector('input[name="duration_choice"]:checked');
    if (!chosen) {
      alert('Please choose a rental duration above before submitting.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const data = new FormData(rentalForm);
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
    lines.push(`Body part: ${data.get('injury_type') || '(not provided)'}`);
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

    const subject = `[CCRS Rental] NICE1 ${chosen.dataset.label || ''} — ${data.get('first_name') || ''} ${data.get('last_name') || ''}`;
    const body = lines.join('\n');
    window.location.href = `mailto:contact@recoverwithccrs.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const success = rentalForm.querySelector('.form-success');
    if (success) success.classList.add('show');
    window.scrollTo({ top: rentalForm.offsetTop - 100, behavior: 'smooth' });
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
