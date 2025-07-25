const rateLimiter = require("express-rate-limit");
const LoggerUtil = require("../utils/logger_util");

class ResponderMiddleWare {
    constructor(env_variables) {
        this.name           = "responder_middleware";
        this.message        = "Too many requests from this IP, please try again later";
        this.window         = 20 * 60 * 1000; // 20 minutes
        this.max_requests   = 250;
        this.ENV            = env_variables;
        this.logger         = new LoggerUtil(this.name, this.ENV);
    }

    /**
     * Rate limit handler when user exceeds allowed number of requests
     */
    requestRateLimitHandler = (req, res, next) => {
        this.logger.info(`[${this.name}] 🚫 Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);

        res.status(429).json({
            status: "error",
            code: "429",
            msg: "rate_limit_exceeded",
            data: "You have exceeded the rate limit for this endpoint. Please try again later."
        });
    };

    /**
     * Attach standard JSON response helpers to the response object
     */
    apiResponseFormatter = (req, res, next) => {
        res.errResponse = (code = 500, msg = 'An error occurred', data = []) => {
            res.status(code).json({ status: 'error', msg, data });
        };

        res.successResponse = (code = 200, msg = 'Operation Successful', data = []) => {
            res.status(code).json({ status: 'success', msg, data });
        };

        res.infoResponse = (code = 200, msg = 'Operation Information', data = []) => {
            res.status(code).json({ status: 'info', msg, data });
        };

        next();
    };

    /**
     * Middleware to standardize cookie and header setting
     */
    apiCookieHeaderFormatter = (req, res, next) => {
        res.setCookie = (name, value, max_age_in_days = 1) => {
            const maxAge = 1000 * 60 * 60 * 24 * parseFloat(max_age_in_days); // Convert days to ms
            res.cookie(name, value, {
                httpOnly: true,
                sameSite: 'Strict',
                secure: this.ENV?.MODE === "production",
                path: "/",
                maxAge
            });
        };

        res.setHeaderValue = (name, value) => {
            res.setHeader(name, value);
        };

        next();
    };

    /**
     * Global handler for unknown/invalid routes
     */
    handle404Error = (req, res) => {
        return res.status(404).json({ status: "error", code: "404", msg: "invalid_request_resource_not_found" });
    };

    /**
     * Global error handler middleware
     */
    handleGeneralError = (err, req, res, next) => {
        const is_dev        = this.ENV?.MODE === "development";
        res.locals.message  = err.message;
        res.locals.error    = is_dev ? err : {};

        this.logger.error(`[${this.name}] ❌ Server Error`, { err });

        res.status(500).json({ status: "error", code: 500, msg: "server_error" });
    };

    /**
     * Initialize and return the Express rate limiter middleware
     */
    initialiazeRateLimitter = () => {
        return rateLimiter({ windowMs: this.window, max: this.max_requests, handler: this.requestRateLimitHandler, message: this.message });
    };

    /**
     * Set various security headers on all responses
     */
    secureHeaders = (req, res, next) => {
        // Basic security headers
        res.setHeader("X-XSS-Protection", "1; mode=block"); // XSS protection
        res.setHeader("X-Content-Type-Options", "nosniff"); // Prevent MIME sniffing
        res.setHeader("X-Frame-Options", "SAMEORIGIN");     // Prevent clickjacking

        // Strict CSP to restrict content sources
        res.setHeader("Content-Security-Policy",
        "default-src 'self'; " +
        "script-src 'self' https://unpkg.com 'unsafe-eval'; " +
        "style-src 'self' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com; " +
        "img-src 'self' blob: data:; " +  // <-- Allow blob: and data: for images
        "object-src 'none';"
    );

        // HSTS header - enforce HTTPS on supported clients
        res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

        next();
    };
}

module.exports = ResponderMiddleWare;
