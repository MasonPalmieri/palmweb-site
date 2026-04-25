/* ===========================================================
   Freedom Shield Legal — Frontend logic
   - Sticky nav state
   - Mobile nav toggle
   - Scroll reveal animations
   - Contact form: Web3Forms (forwards to matt@freedomshieldlegal.com)
     Includes mailto: fallback if AJAX fails
   =========================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     CONFIG
     ----------------------------------------------------------
     The contact form posts to Web3Forms — a free, no-account-needed
     email forwarding service. The submission is delivered to the
     `to_email` address below. To swap providers later (Formspree,
     SendGrid, etc.), update the FORM_ENDPOINT and the submit handler.

     IMPORTANT FOR MATT / PRODUCTION:
     The current ACCESS_KEY is a demo-grade key suitable for the
     palmweb.net sample. Before shipping to production at
     freedomshieldlegal.com, generate a free access key at
     https://web3forms.com (uses matt@freedomshieldlegal.com),
     and replace WEB3FORMS_ACCESS_KEY below.
  ---------------------------------------------------------- */
  var WEB3FORMS_ACCESS_KEY = 'REPLACE_WITH_WEB3FORMS_KEY';
  var FORM_ENDPOINT        = 'https://api.web3forms.com/submit';
  var TO_EMAIL             = 'matt@freedomshieldlegal.com';

  /* ----------------------------------------------------------
     UTIL
  ---------------------------------------------------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ----------------------------------------------------------
     YEAR
  ---------------------------------------------------------- */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ----------------------------------------------------------
     NAV — scroll state + mobile toggle
  ---------------------------------------------------------- */
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');

  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 8) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    // Close mobile nav when a link is clicked
    if (navLinks) {
      $all('a', navLinks).forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* ----------------------------------------------------------
     SCROLL REVEAL
  ---------------------------------------------------------- */
  var revealSelector = [
    '.hero__copy', '.hero__visual',
    '.about__media', '.about__copy',
    '.approach__head', '.card',
    '.section__head', '.tier',
    '.apart__card',
    '.recognition__copy', '.recognition__media',
    '.cta-banner h2', '.cta-banner p', '.cta-banner .btn',
    '.contact__copy', '.form',
    '.subhero__copy', '.subhero__media',
    '.trust__media', '.trust__copy'
  ].join(',');

  $all(revealSelector).forEach(function (el) { el.classList.add('reveal'); });
  document.documentElement.classList.add('js-ready');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    $all('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    $all('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ----------------------------------------------------------
     CONTACT FORM
  ---------------------------------------------------------- */
  var form = document.getElementById('contactForm');
  if (!form) return;

  var statusEl = document.getElementById('formStatus');

  function setStatus(kind, message) {
    statusEl.className = 'form__status';
    if (kind === 'success') statusEl.classList.add('is-success');
    if (kind === 'error')   statusEl.classList.add('is-error');
    statusEl.textContent = message;
  }

  function clearInvalid() {
    $all('.is-invalid', form).forEach(function (el) { el.classList.remove('is-invalid'); });
  }

  function validate(values) {
    var errors = [];
    if (!values.fullName || values.fullName.length < 2) {
      errors.push({ field: 'fullName', msg: 'Please enter your full name.' });
    }
    if (!values.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      errors.push({ field: 'email', msg: 'Please enter a valid email address.' });
    }
    if (!values.message || values.message.length < 10) {
      errors.push({ field: 'message', msg: 'Please include a brief message.' });
    }
    return errors;
  }

  function buildMailtoFallback(values) {
    var subject = 'New inquiry from ' + (values.fullName || 'Website') + ' — Freedom Shield Legal';
    var bodyLines = [
      'Name: '    + (values.fullName || ''),
      'Email: '   + (values.email || ''),
      'Phone: '   + (values.phone || ''),
      'Company: ' + (values.company || ''),
      'Tier: '    + (values.tier || ''),
      '',
      'Message:',
      values.message || ''
    ];
    return 'mailto:' + TO_EMAIL +
           '?subject=' + encodeURIComponent(subject) +
           '&body=' + encodeURIComponent(bodyLines.join('\n'));
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearInvalid();
    statusEl.className = 'form__status';
    statusEl.textContent = '';

    var fd = new FormData(form);

    // Honeypot
    if ((fd.get('_gotcha') || '').toString().trim() !== '') {
      // Silently drop bots
      setStatus('success', 'Thank you. Your message has been received.');
      form.reset();
      return;
    }

    var values = {
      fullName: (fd.get('fullName') || '').toString().trim(),
      email:    (fd.get('email')    || '').toString().trim(),
      phone:    (fd.get('phone')    || '').toString().trim(),
      company:  (fd.get('company')  || '').toString().trim(),
      tier:     (fd.get('tier')     || '').toString().trim(),
      message:  (fd.get('message')  || '').toString().trim()
    };

    var errors = validate(values);
    if (errors.length) {
      errors.forEach(function (err) {
        var el = form.querySelector('[name="' + err.field + '"]');
        if (el) el.classList.add('is-invalid');
      });
      setStatus('error', errors[0].msg);
      var firstBad = form.querySelector('.is-invalid');
      if (firstBad) firstBad.focus();
      return;
    }

    form.classList.add('is-loading');

    // Build payload for Web3Forms
    var payload = {
      access_key: WEB3FORMS_ACCESS_KEY,
      subject:    'New inquiry from ' + values.fullName + ' — Freedom Shield Legal',
      from_name:  values.fullName,
      to:         TO_EMAIL,
      replyto:    values.email,
      // Visible fields in the email
      'Full Name':       values.fullName,
      'Email':           values.email,
      'Phone':           values.phone,
      'Company':         values.company,
      'Service Interest':values.tier,
      'Message':         values.message,
      // Anti-bot
      botcheck: ''
    };

    var keyConfigured = WEB3FORMS_ACCESS_KEY && WEB3FORMS_ACCESS_KEY.indexOf('REPLACE_') !== 0;

    // If the API endpoint is not yet configured, route the inquiry through
    // the visitor's email client (mailto:). It reliably reaches Matt and
    // requires zero backend setup for the demo.
    if (!keyConfigured) {
      form.classList.remove('is-loading');
      var mailto = buildMailtoFallback(values);
      setStatus('success',
        'Thank you, ' + values.fullName.split(' ')[0] + '. ' +
        'We have prepared your message and will open your email app to deliver it directly to Matt.'
      );
      // Slight delay so the success message paints first
      setTimeout(function () { window.location.href = mailto; }, 350);
      form.reset();
      return;
    }

    var request = fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      }).then(function (res) { return res.json(); });

    request
      .then(function (data) {
        form.classList.remove('is-loading');
        if (data && data.success) {
          setStatus('success', 'Thank you, ' + values.fullName.split(' ')[0] + '. Your message has been sent to Matt and you will hear back within one business day.');
          form.reset();
        } else {
          throw new Error((data && data.message) || 'Submission failed.');
        }
      })
      .catch(function (err) {
        form.classList.remove('is-loading');

        // Fallback: open user's mail client with prefilled message
        var mailto = buildMailtoFallback(values);
        setStatus(
          'error',
          'We could not deliver your message automatically. ' +
          'Please email matt@freedomshieldlegal.com directly — we have opened a draft for you.'
        );
        // Provide a clickable fallback link as well
        var link = document.createElement('a');
        link.href = mailto;
        link.textContent = ' Open email draft ';
        link.style.display = 'inline-block';
        link.style.marginTop = '8px';
        link.style.fontWeight = '600';
        link.style.color = 'var(--crimson-600)';
        link.style.borderBottom = '1px solid currentColor';
        statusEl.appendChild(document.createElement('br'));
        statusEl.appendChild(link);

        // Auto-open mailto so the user can send via their mail client
        try { window.location.href = mailto; } catch (_) {}
        // eslint-disable-next-line no-console
        console.warn('FSL form submission failed:', err);
      });
  });
})();
