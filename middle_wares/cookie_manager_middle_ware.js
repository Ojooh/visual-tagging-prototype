const crypto = require("crypto");
const LoggerUtil = require("../utils/logger_util");

class CookieManagerMiddleWare {
    constructor(env_variables) {
        this.name           = "cookie_manager_middleware";
        this.ENV            = env_variables;
        this.is_production  = this.ENV.MODE === "production";
        this.logger         = new LoggerUtil(this.name, this.ENV);
    }

    /**
     * Sets a cookie on the response with secure defaults.
     * @param {object} res - Express response object
     * @param {string} name - Cookie name
     * @param {string} value - Cookie value
     * @param {object} options - Optional cookie settings
     */
    setCookie = (res, name, value, options = {}) => {
        const default_options = {
            httpOnly: true,                     // Prevent client-side JS access (secure)
            secure: this.is_production,         // Use HTTPS only in production
            sameSite: "Strict",                 // Protect against CSRF
            path: "/",                          // Cookie available to all routes
            maxAge: 1000 * 60 * 60 * 24 * 7     // 7 days in milliseconds
        };

        const cookie_options = { ...default_options, ...options };

        res.cookie(name, value, cookie_options); // Set the cookie
    };

    /**
     * Generates a UUID and sets it as a secure session ID cookie.
     * @param {object} res - Express response object
     * @returns {string} - The new session ID
     */
    generateAndSetSessionID = (res) => {
        const session_id = crypto.randomUUID();  // Use built-in UUID generator
        this.setCookie(res, "session_id", session_id);
        return session_id;
    };

    /**
     * Parses raw cookie header into a key-value map.
     * Also attaches the result to `req.cookies_object`.
     * @param {object} req - Express request object
     * @returns {object} - Parsed cookies
     */
    parseCookies = (req) => {
        const cookie_header = req.headers.cookie;

        if (!cookie_header) return {};

        const cookie_object = Object.fromEntries(
            cookie_header
                .split(";")
                .map(cookie => cookie.trim().split("="))
                .map(([key, ...val]) => [key, decodeURIComponent(val.join("="))])
        );

        req.cookies_object = cookie_object; // Attach to request object
        return cookie_object;
    };

    /**
     * Gets a specific cookie value from request headers.
     * @param {object} req - Express request object
     * @param {string} name - Cookie name to fetch
     * @returns {string|null} - Cookie value or null
     */
    getCookie = (req, name) => {
        const cookies = this.parseCookies(req);
        return cookies[name] || null;
    };

    /**
     * Middleware: Ensure session ID exists on every request.
     * Sets a new one if missing.
     * @param {object} req - Express request object
     * @param {object} res - Express response object
     * @param {function} next - Express next middleware function
     */
    ensureSessionId = (req, res, next) => {
        const session_id = this.getCookie(req, "session_id");

        if (!session_id) {
            // If session_id cookie is missing, create a new one
            const new_session_id = this.generateAndSetSessionID(res);
            this.logger.info(`[${this.name}] 🆕 New Session ID created: ${new_session_id}`);
        } else {
            this.logger.info(`[${this.name}] ✅ Existing Session ID found: ${session_id}`);
        }

        // Re-parse to ensure req.cookies_object is always populated
        this.parseCookies(req);

        next(); // Continue request processing
    };
}

module.exports = CookieManagerMiddleWare;
