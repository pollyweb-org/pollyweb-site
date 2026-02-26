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
            return false;
        }
        return EEA_COUNTRIES.has(countryCode);
    }

    function isTermsPage() {
        const path = window.location.pathname.replace(/\/+$/, "");
        return path === "/terms" || path === "/terms.html";
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

        if (isTermsPage()) {
            setConsent("granted");
            loadGoogleTag();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAnalytics, { once: true });
    } else {
        initAnalytics();
    }
})();
