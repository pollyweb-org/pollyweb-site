(() => {
    const DEFAULT_CONSENT_KEY = "pollyweb_analytics_consent";
    const DEFAULT_EVENT_NAME = "pollyweb:analytics-consent-updated";
    const CONSENT_REQUIRED_COUNTRIES = new Set([
        "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
        "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL",
        "PT", "RO", "SK", "SI", "ES", "SE", "GB", "CH"
    ]);

    let consentRequiredPromise = null;

    function getConsentKey() {
        return window.pollywebAnalyticsConsent?.key || DEFAULT_CONSENT_KEY;
    }

    function getEventName() {
        return window.pollywebAnalyticsConsent?.eventName || DEFAULT_EVENT_NAME;
    }

    function getConsent() {
        if (window.pollywebAnalyticsConsent?.getConsent) {
            return window.pollywebAnalyticsConsent.getConsent();
        }

        try {
            return localStorage.getItem(getConsentKey());
        } catch (_err) {
            return null;
        }
    }

    function setConsent(value) {
        if (window.pollywebAnalyticsConsent?.setConsent) {
            window.pollywebAnalyticsConsent.setConsent(value);
            return;
        }

        try {
            localStorage.setItem(getConsentKey(), value);
            window.dispatchEvent(new CustomEvent(getEventName(), { detail: { value } }));
        } catch (_err) {
            // Ignore write failures silently.
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

    async function isConsentRequired() {
        if (window.pollywebAnalyticsConsent?.isConsentRequired) {
            return window.pollywebAnalyticsConsent.isConsentRequired();
        }

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

    function ensureStyles() {
        if (document.getElementById("pollyweb-cookie-consent-style")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "pollyweb-cookie-consent-style";
        style.textContent = `
            .cookie-consent-banner {
                position: fixed;
                left: 50%;
                bottom: 1rem;
                transform: translateX(-50%);
                width: min(960px, calc(100vw - 1rem));
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                padding: 0.9rem 1rem;
                border-radius: 12px;
                border: 1px solid rgba(255, 255, 255, 0.14);
                background: rgba(21, 21, 32, 0.96);
                backdrop-filter: blur(8px);
                box-shadow: 0 10px 26px rgba(0, 0, 0, 0.3);
                z-index: 1100;
            }

            .cookie-consent-text {
                margin: 0;
                color: #a8a8b8;
                font-size: 0.95rem;
                line-height: 1.45;
            }

            .cookie-consent-text a {
                color: #00d4ff;
                text-decoration: none;
            }

            .cookie-consent-actions {
                display: flex;
                align-items: center;
                gap: 0.55rem;
                flex-shrink: 0;
            }

            .cookie-btn {
                border: 1px solid transparent;
                border-radius: 999px;
                padding: 0.45rem 0.85rem;
                font: inherit;
                font-size: 0.85rem;
                line-height: 1.2;
                cursor: pointer;
                transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
                white-space: normal;
                max-width: 100%;
            }

            .cookie-btn:hover {
                transform: translateY(-1px);
            }

            .cookie-btn-primary {
                color: #0a0a0f;
                background: #00d4ff;
            }

            .cookie-btn-secondary {
                color: #a8a8b8;
                border-color: rgba(255, 255, 255, 0.22);
                background: transparent;
            }

            @media (max-width: 800px) {
                .cookie-consent-banner {
                    flex-direction: column;
                    align-items: flex-start;
                    width: calc(100vw - 1rem);
                }

                .cookie-consent-actions {
                    width: 100%;
                }

                .cookie-btn {
                    flex: 1 1 0;
                    min-height: 40px;
                }
            }
        `;

        document.head.appendChild(style);
    }

    function removeBanner() {
        document.getElementById("cookie-consent-banner")?.remove();
    }

    function showBanner() {
        if (document.getElementById("cookie-consent-banner")) {
            return;
        }

        const banner = document.createElement("aside");
        banner.id = "cookie-consent-banner";
        banner.className = "cookie-consent-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-live", "polite");
        banner.setAttribute("aria-label", "Cookie consent");
        banner.innerHTML = [
            '<p class="cookie-consent-text">We use privacy-friendly analytics cookies to understand site traffic. <a href="/terms.html">Learn more</a>.</p>',
            '<div class="cookie-consent-actions">',
            '<button type="button" class="cookie-btn cookie-btn-secondary" data-consent="denied">No thanks</button>',
            '<button type="button" class="cookie-btn cookie-btn-primary" data-consent="granted">Accept</button>',
            "</div>"
        ].join("");

        banner.addEventListener("click", (event) => {
            const button = event.target.closest("[data-consent]");
            if (!button) return;
            const value = button.getAttribute("data-consent");
            if (value !== "granted" && value !== "denied") return;
            setConsent(value);
            removeBanner();
        });

        document.body.appendChild(banner);
    }

    async function initCookieConsentBanner() {
        const required = await isConsentRequired();
        if (!required) {
            removeBanner();
            return;
        }

        const consent = getConsent();
        if (consent === "granted" || consent === "denied") {
            removeBanner();
            return;
        }

        ensureStyles();
        showBanner();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initCookieConsentBanner, { once: true });
    } else {
        initCookieConsentBanner();
    }
})();
