(() => {
    const MEASUREMENT_ID = "G-JFBD11YF1J";
    const CONSENT_KEY = "pollyweb_analytics_consent";
    const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
    const CONSENT_UPDATED_EVENT = "pollyweb:analytics-consent-updated";
    const CONSENT_REQUIRED_COUNTRIES = new Set([
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
        "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL",
        "PT", "RO", "SK", "SI", "ES", "SE", "GB", "CH"
    ]);
    let consentRequiredPromise = null;

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

    function emitConsentUpdated(value) {
        window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: { value } }));
    }

    function writeConsentCookie(value) {
        document.cookie = `${CONSENT_KEY}=${value}; Max-Age=${CONSENT_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
    }

    function readConsentCookie() {
        const prefix = `${CONSENT_KEY}=`;
        const raw = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
        if (!raw) return null;
        const value = raw.slice(prefix.length);
        return value === "granted" || value === "denied" ? value : null;
    }

    function setConsent(value, options = {}) {
        const { emit = true } = options;
        if (value !== "granted" && value !== "denied") {
            return;
        }

        try {
            localStorage.setItem(CONSENT_KEY, value);
        } catch (err) {
            console.warn("Unable to persist analytics consent preference.", err);
        }

        writeConsentCookie(value);

        if (emit) {
            emitConsentUpdated(value);
        }
    }

    function getConsent() {
        try {
            const localValue = localStorage.getItem(CONSENT_KEY);
            if (localValue === "granted" || localValue === "denied") {
                return localValue;
            }
        } catch (err) {
            console.warn("Unable to read analytics consent preference.", err);
        }

        return readConsentCookie();
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

    async function isConsentRequiredUser() {
        if (!consentRequiredPromise) {
            consentRequiredPromise = (async () => {
                const countryCode = await fetchCountryCode();
                if (!countryCode) {
                    // Fail closed for compliance when region cannot be resolved.
                    return true;
                }

                return CONSENT_REQUIRED_COUNTRIES.has(countryCode);
            })();
        }

        return consentRequiredPromise;
    }

    async function initAnalytics() {
        const consent = getConsent();
        const consentRequired = await isConsentRequiredUser();

        if (!consentRequired) {
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

        return;
    }

    window.pollywebAnalyticsConsent = {
        key: CONSENT_KEY,
        eventName: CONSENT_UPDATED_EVENT,
        getConsent,
        setConsent(value) {
            setConsent(value);
            if (value === "granted") {
                loadGoogleTag();
            }
        },
        isConsentRequired: isConsentRequiredUser
    };

    window.addEventListener(CONSENT_UPDATED_EVENT, (event) => {
        if (event?.detail?.value === "granted") {
            loadGoogleTag();
        }
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAnalytics, { once: true });
    } else {
        initAnalytics();
    }
})();
