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
