(() => {
    const MEASUREMENT_ID = "G-JFBD11YF1J";
    const CONSENT_KEY = "pollyweb_analytics_consent";
    const EEA_COUNTRIES = new Set([
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
        "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL",
        "PT", "RO", "SK", "SI", "ES", "SE"
    ]);

    function loadGoogleTag() {
        if (window.__pollywebGaLoaded) return;
        window.__pollywebGaLoaded = true;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag() {
            window.dataLayer.push(arguments);
        };

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
        document.head.appendChild(script);

        window.gtag("js", new Date());
        window.gtag("config", MEASUREMENT_ID, {
            page_path: window.location.pathname,
            page_title: document.title
        });
    }

    function setConsent(value) {
        try {
            localStorage.setItem(CONSENT_KEY, value);
        } catch (err) {
            console.warn("Unable to persist analytics consent preference.", err);
        }
    }

    function getConsent() {
        try {
            return localStorage.getItem(CONSENT_KEY);
        } catch (err) {
            console.warn("Unable to read analytics consent preference.", err);
            return null;
        }
    }

    function removeBanner() {
        const node = document.getElementById("analytics-consent-banner");
        if (node) node.remove();
    }

    function showConsentBanner() {
        if (document.getElementById("analytics-consent-banner")) return;

        const banner = document.createElement("div");
        banner.id = "analytics-consent-banner";
        banner.innerHTML = `
            <div style="position:fixed;left:1rem;right:1rem;bottom:1rem;z-index:10000;background:#111827;color:#f9fafb;padding:1rem;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
                <p style="margin:0 0 .75rem 0;font-size:.95rem;line-height:1.4;">We use analytics cookies to understand website usage. Accept analytics tracking?</p>
                <div style="display:flex;gap:.5rem;justify-content:flex-end;">
                    <button id="analytics-reject" type="button" style="border:1px solid #6b7280;background:transparent;color:#f9fafb;padding:.5rem .75rem;border-radius:8px;cursor:pointer;">Reject</button>
                    <button id="analytics-accept" type="button" style="border:1px solid #2563eb;background:#2563eb;color:#fff;padding:.5rem .75rem;border-radius:8px;cursor:pointer;">Accept</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        const acceptButton = document.getElementById("analytics-accept");
        const rejectButton = document.getElementById("analytics-reject");

        if (acceptButton) {
            acceptButton.addEventListener("click", () => {
                setConsent("granted");
                removeBanner();
                loadGoogleTag();
            });
        }

        if (rejectButton) {
            rejectButton.addEventListener("click", () => {
                setConsent("denied");
                removeBanner();
            });
        }
    }

    async function fetchCountryCode() {
        try {
            const response = await fetch("/cdn-cgi/trace", { cache: "no-store" });
            if (!response.ok) return null;
            const payload = await response.text();
            const match = payload.match(/^loc=([A-Z]{2})$/m);
            return match ? match[1] : null;
        } catch (_err) {
            return null;
        }
    }

    async function isEeaUser() {
        const countryCode = await fetchCountryCode();
        if (!countryCode) {
            return true;
        }
        return EEA_COUNTRIES.has(countryCode);
    }

    async function initAnalytics() {
        const consent = getConsent();
        const eea = await isEeaUser();

        if (!eea) {
            loadGoogleTag();
            return;
        }

        if (consent === "granted") {
            loadGoogleTag();
            return;
        }

        if (consent === "denied") {
            return;
        }

        showConsentBanner();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAnalytics, { once: true });
    } else {
        initAnalytics();
    }
})();
