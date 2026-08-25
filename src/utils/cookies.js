export function initCookieConsent(options = {}) {
  const {
    bannerId = 'cookie-banner',
    gtmId = 'GTM-WKK8ZWP',
    cookieDomain = '.nisra.gov.uk',
    cookieDays = 365
  } = options;

  const cookieBanner = document.getElementById(bannerId);
  if (!cookieBanner) return;

  const COOKIE_NAME = 'cookie-agreed';
  const ACCEPTED = '2';
  const REJECTED = '0';

  function getCookie(name) {
    const parts = document.cookie ? document.cookie.split('; ') : [];
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith(name + '=')) {
        return decodeURIComponent(parts[i].substring(name.length + 1));
      }
    }
    return null;
  }

  function setCookie(name, value, days) {
    const expires = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000
    ).toUTCString();

    document.cookie =
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}` +
      `; Expires=${expires}` +
      `; Path=/` +
      `; Domain=${cookieDomain}` +
      `; Secure` +
      `; SameSite=Lax`;
  }

  function hideBanner() {
    cookieBanner.style.display = 'none';
    cookieBanner.setAttribute('aria-hidden', 'true');
  }

  function showBanner() {
    cookieBanner.style.display = 'block';
    cookieBanner.removeAttribute('aria-hidden');
  }

  function loadGoogleTagManager() {
    if (window.__nisraGtmLoaded) return;
    window.__nisraGtmLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'gtm.start': new Date().getTime(),
      event: 'gtm.js'
    });

    const firstScript = document.getElementsByTagName('script')[0];
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    firstScript.parentNode.insertBefore(gtmScript, firstScript);

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
    iframe.height = '0';
    iframe.width = '0';
    iframe.style.display = 'none';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);
  }

  // Build banner HTML (no GTM yet)
  cookieBanner.classList.add('cookies-infobar');
  cookieBanner.innerHTML = `
    <div class="container">
      <p><strong>Cookies on the NI Historical Data Explorer</strong></p>
      <p>
        This prototype web page places small amounts of information known as cookies on your device.
        <a href="https://www.nisra.gov.uk/cookies"
           class="cookiesbarlink"
           target="_blank"
           rel="noopener noreferrer">
          Find out more about cookies
        </a>.
      </p>
      <button id="accept-cookies" class="cookies-infobar_btn">Accept cookies</button>
      <button id="reject-cookies" class="cookies-infobar_btn_reject">Reject cookies</button>
    </div>
  `;

  const acceptBtn = document.getElementById('accept-cookies');
  const rejectBtn = document.getElementById('reject-cookies');

  const existing = getCookie(COOKIE_NAME);

  // Already accepted on nisra.gov.uk
  if (existing === ACCEPTED) {
    hideBanner();
    loadGoogleTagManager();
    return;
  }

  // Explicitly rejected
  if (existing === REJECTED) {
    hideBanner();
    return;
  }

  // No decision yet
  showBanner();

  acceptBtn?.addEventListener('click', () => {
    setCookie(COOKIE_NAME, ACCEPTED, cookieDays);
    hideBanner();
    loadGoogleTagManager();
  });

  rejectBtn?.addEventListener('click', () => {
    setCookie(COOKIE_NAME, REJECTED, cookieDays);
    hideBanner();
  });
}
