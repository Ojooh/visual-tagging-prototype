const cors = require("cors");

const LoggerUtil        = require("../utils/logger_util");
const { OriginCache }   = require("../utils/cache_util");
const {
    LOCAL_ORIGIN_LIST,
    STAGING_ORIGIN_LIST,
    PRODUCTION_ORIGIN_LIST
} = require("../enums/constants.enums");

class CORSManagerMiddleWare {
    constructor(env_variables) {
        this.name           = "cors_manager_middle_ware";
        this.ENV            = env_variables;

        this.logger         = new LoggerUtil(this.name, this.ENV);
        this.origin_cache   = OriginCache;

        this.logger.info(`Running in ${this.ENV?.MODE} Mode`);
    }

    /**
     * Middleware: Logs metadata about the incoming request for debugging and auditing
     */
    logOriginData = (req, res, next) => {
        const { headers, method, protocol } = req;

        // Determine origin of the request
        const origin_url = headers?.origin || (headers?.referer ? new URL(headers.referer).origin : null) || `${protocol}://${req?.get("host")}`;

        const request_info = {
            device_id: headers["x-device-id"],
            device_name: headers["x-device-name"] || "unknown",
            origin_url,
            session_id: req?.cookies?.session_id || null,
            ip_address: req.clientIp || req.ip, // fallback to req.ip
            user_agent: headers["user-agent"],
            host_url: req.get("host"),
            access_token: headers["authorization"] || "N/A"
        };

        // ✅ Logging request metadata
        this.logger.info(`[${this.name}] Origin: ${request_info.origin_url}, Host: ${request_info.host_url}`);
        this.logger.info(`[${this.name}] ${method} → ${req.originalUrl}`);
        this.logger.info(`[${this.name}] Device ID: ${request_info.device_id}`);
        this.logger.info(`[${this.name}] Device Name: ${request_info.device_name}`);
        this.logger.info(`[${this.name}] Session ID: ${request_info.session_id}`);
        this.logger.info(`[${this.name}] IP Address: ${request_info.ip_address}`);
        this.logger.info(`[${this.name}] Access Token: ${request_info.access_token}`);

        next();
    };

    /**
     * Middleware for CORS: Dynamically validate request origin
     */
    validateRequestOrigin = async (origin, callback) => {
        try {
            // ✅ Allow no-origin requests (e.g., Postman, curl, native apps)
            if (!origin) return callback(null, true);

            const cached_result = this.origin_cache.get(origin);

            if (cached_result !== undefined) {
                return this.#validateCachedOrigin(origin, callback, cached_result);
            }

            const mode              = this.ENV?.MODE;
            const valid_origin_list = mode === "development" ? LOCAL_ORIGIN_LIST : mode === "production" ? PRODUCTION_ORIGIN_LIST : STAGING_ORIGIN_LIST;

            return this.#validateOrigin(valid_origin_list, origin, callback);
        } 
        catch (error) {
            this.logger.error(`[${this.name}] Error validating origin`, { error });
            return callback(new Error("CORS validation failed"));
        }
    };

    /**
     * Returns a CORS middleware instance with origin validation
     */
    initializeCORSBlocking = () => { return cors({ origin: this.validateRequestOrigin, credentials: true }); };

    /**
     * Middleware: Enforce HTTPS in non-dev environments
     */
    forceHttps = (req, res, next) => {
        const is_secure = req.secure || req.headers["x-forwarded-proto"] === "https";

        if (is_secure || this.ENV?.MODE === "development") { return next(); }

        const host  = req.headers.host;
        const url   = req.originalUrl;
        res.redirect(301, `https://${host}${url}`);
    };

    /**
     * Private: Handle cached origin validation
     */
    #validateCachedOrigin = (origin, callback, cached_result) => {
        if (cached_result) {
            this.logger.success(`[${this.name}] ✅ Valid (cached) origin: ${origin}`);
            return callback(null, true);
        }

        this.logger.error(`[${this.name}] ❌ Invalid (cached) origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
    };

    /**
     * Private: Validate origin against known list and cache it
     */
    #validateOrigin = (valid_list, origin, callback) => {
        if (valid_list?.includes(origin)) {
            this.origin_cache.set(origin, true);
            this.logger.success(`[${this.name}] ✅ Valid origin: ${origin}`);
            return callback(null, true);
        }

        this.origin_cache.set(origin, false);
        this.logger.error(`[${this.name}] ❌ Invalid origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
    };
}

module.exports = CORSManagerMiddleWare;
