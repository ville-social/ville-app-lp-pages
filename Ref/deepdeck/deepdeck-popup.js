(() => {
  const scriptUrl = document.currentScript?.src || '';
  const assetBase = scriptUrl ? new URL('.', scriptUrl).href : 'Ref/deepdeck/';
  const imageUrl = new URL('../optimized/deepdeck/deck-in-tin-900.webp', assetBase).href;
  const endpoint = document.documentElement.dataset.deepdeckEndpoint || 'https://us-central1-ville-9fe9d.cloudfunctions.net/deepDeckSignup';
  const isDeepDeckPage = window.location.pathname.includes('/deepdeck');
  const submittedKey = 'ville.deepdeck.signup.submitted';
  const dismissedKey = 'ville.deepdeck.popup.dismissedUntil';
  const dismissMs = 1000 * 60 * 60 * 24 * 7;

  const submitSignup = async (form, status) => {
    const formData = new FormData(form);
    const email = String(formData.get('email') || '').trim();
    const hp = String(formData.get('company') || '').trim();
    const button = form.querySelector('button[type="submit"]');

    if (hp) return;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      status.textContent = 'Enter a valid email.';
      return;
    }

    button.disabled = true;
    status.textContent = 'Adding you...';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          product: 'deepdeck',
          source: window.location.pathname,
          page: window.location.href,
          createdAt: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error(`Signup failed: ${response.status}`);
      localStorage.setItem(submittedKey, 'true');
      status.textContent = 'You are on the list.';
      form.reset();
    } catch (error) {
      status.textContent = 'Signup endpoint is not connected yet.';
    } finally {
      button.disabled = false;
    }
  };

  const wireSignupForms = () => {
    document.querySelectorAll('[data-deepdeck-signup]').forEach((form) => {
      if (form.dataset.deepdeckWired === 'true') return;
      form.dataset.deepdeckWired = 'true';
      const status = form.parentElement?.querySelector('[data-deepdeck-status]') || document.createElement('p');

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        submitSignup(form, status);
      });
    });
  };

  const shouldAutoShow = () => {
    if (localStorage.getItem(submittedKey) === 'true') return false;
    const dismissedUntil = Number(localStorage.getItem(dismissedKey) || 0);
    return Date.now() > dismissedUntil;
  };

  const buildPopup = () => {
    if (isDeepDeckPage) {
      wireSignupForms();
      return;
    }

    if (document.querySelector('[data-deepdeck-popup]')) return;

    const trigger = document.createElement('button');
    trigger.className = 'dd-popup-trigger';
    trigger.type = 'button';
    trigger.textContent = 'Deep Deck';
    trigger.setAttribute('aria-haspopup', 'dialog');
    trigger.setAttribute('aria-controls', 'deepdeck-popup');

    const popup = document.createElement('div');
    popup.className = 'dd-popup';
    popup.id = 'deepdeck-popup';
    popup.dataset.deepdeckPopup = '';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    popup.setAttribute('aria-labelledby', 'deepdeck-popup-title');
    popup.innerHTML = `
      <div class="dd-popup-backdrop" data-deepdeck-close></div>
      <div class="dd-popup-panel">
        <button class="dd-popup-close" type="button" aria-label="Close Deep Deck signup" data-deepdeck-close>&times;</button>
        <div class="dd-popup-media">
          <img data-deepdeck-image="${imageUrl}" alt="Deep Deck card game in a yellow tin" width="900" height="1303" loading="lazy" decoding="async">
        </div>
        <div class="dd-popup-content">
          <p class="dd-popup-kicker">New from Ville</p>
          <h2 id="deepdeck-popup-title">Get Deep Deck updates.</h2>
          <p>Conversation cards for getting past small talk. Add your email for launch updates.</p>
          <form class="dd-signup-form" data-deepdeck-signup>
            <label for="deepdeck-popup-email">Email</label>
            <input id="deepdeck-popup-email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com" required>
            <input class="dd-hp" name="company" tabindex="-1" autocomplete="off">
            <button type="submit">Join</button>
          </form>
          <p class="dd-form-status" data-deepdeck-status aria-live="polite"></p>
          <a class="dd-popup-link" href="${new URL('../../deepdeck/', assetBase).href}">See Deep Deck</a>
        </div>
      </div>
    `;

    const open = () => {
      const image = popup.querySelector('[data-deepdeck-image]');
      if (image && !image.getAttribute('src')) {
        image.setAttribute('src', image.dataset.deepdeckImage);
      }
      popup.classList.add('is-open');
      trigger.hidden = true;
      trigger.setAttribute('aria-expanded', 'true');
      window.setTimeout(() => popup.querySelector('input[type="email"]')?.focus(), 120);
    };

    const close = () => {
      popup.classList.remove('is-open');
      trigger.hidden = false;
      trigger.setAttribute('aria-expanded', 'false');
      localStorage.setItem(dismissedKey, String(Date.now() + dismissMs));
      trigger.focus({ preventScroll: true });
    };

    trigger.addEventListener('click', open);
    popup.querySelectorAll('[data-deepdeck-close]').forEach((item) => item.addEventListener('click', close));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && popup.classList.contains('is-open')) close();
    });

    document.body.append(trigger, popup);
    wireSignupForms();

    if (shouldAutoShow()) window.setTimeout(open, 4200);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      buildPopup();
      wireSignupForms();
    }, { once: true });
  } else {
    buildPopup();
    wireSignupForms();
  }
})();
