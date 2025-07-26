// Core modules
const http 						= require("http");
const express 					= require("express");
const path 						= require("path");

// Middleware & utility modules
const cookieParser 				= require("cookie-parser");
const fileUpload 				= require("express-fileupload");
const bodyParser 				= require("body-parser");
const requestIp 				= require("request-ip");

// App-specific utilities and middleware
const EnvManagerUtil 			= require("./utils/env_manager_util");
const LoggerUtil 				= require("./utils/logger_util");
const GlobalVariableManager     = require("./utils/global_variable_manager_util");

const ResponderMiddleWare 		= require("./middle_wares/responder_middle_ware");
const CORSManagerMiddleWare 	= require("./middle_wares/cors_manager_middle_ware");
const CookieManagerMiddleWare 	= require("./middle_wares/cookie_manager_middle_ware");
const PythonBridgeManager  		= require("./modules/python_image_tagger_analyzer/python_bridge_manager");

const RouteManager 				= require("./routes/index");

// Main Server Application
class Application {
	constructor() {
		this.name 			= "fiberx_dbms_server_main_application";
		this.app 			= express();
		this.global_vars    = GlobalVariableManager.getInstance();
		this.ENV 			= new EnvManagerUtil()?.env_data;
		this.logger 		= new LoggerUtil(this.name, this.ENV);

		// Initialize custom middlewares
		this.cors_manager 	= new CORSManagerMiddleWare(this.ENV);
		this.responder 		= new ResponderMiddleWare(this.ENV);
		this.cookie_manager = new CookieManagerMiddleWare(this.ENV);
		this.python_analyzer= new PythonBridgeManager(this.ENV);

		// Create HTTP server from express app
		this.server 		= http.Server(this.app); 

		// Make ENV globally accessible
		this.global_vars.setVariable("ENV", this.ENV); 
	}

	// New method: Initialize Python environment (check & install deps)
	initializePythonEnvironment = async () => {
		this.logger.info(`[${this.name}] Initializing Python environment...`);
		try {
			await this.python_analyzer.initialize();
			this.logger.info(`[${this.name}] Python environment ready.`);
		} catch (error) {
			this.logger.error(`[${this.name}] Python environment initialization failed:`, { error });
			throw error; // rethrow to handle in start()
		}
	};

	/**
	 * Initialize and configure all middlewares
	 */
	initializeMiddleware = () => {
		// Configure trust proxy only for production-like environments
		const proxy_value = ["production", "staging"].includes(this.ENV?.MODE) ? 1 : false;
		this.app.set("trust proxy", proxy_value);

		// Set express environment mode
		this.app.set("env", this.ENV.MODE); 
		// Attach client IP extractor
		this.app.use(requestIp.mw()); 

		// Apply rate limiting and CORS blocking
		this.app.use(this.responder.initialiazeRateLimitter());
		this.app.use(this.cors_manager.initializeCORSBlocking());

		// Enforce HTTPS and secure headers
		this.app.use(this.cors_manager.forceHttps);
		this.app.use(this.responder.secureHeaders);

		// Parse cookies and ensure session tracking
		this.app.use(cookieParser());
		this.app.use(this.cookie_manager.ensureSessionId);

		// Attach custom response and cookie utilities
		this.app.use(this.responder.apiResponseFormatter);
		this.app.use(this.responder.apiCookieHeaderFormatter);

		// Set view engine and directory
		this.app.set("views", path.join(__dirname, "client/views"));
		this.app.set("view engine", "ejs");

		// Body parsers (ensure both Express and body-parser for full compatibility)
		this.app.use(express.json());
		this.app.use(express.urlencoded({ extended: false }));
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: false }));

		// File uploads support
		this.app.use(fileUpload());

		// Static asset directories
		this.app.use("/assets", express.static(path.join(__dirname, "client/assets/")));
		this.app.use("/local_uploads", express.static(path.join(__dirname, "local_uploads/")));

		// Logging request origins for traceability/debugging
		this.app.use(this.cors_manager.logOriginData);
	};

	/**
	 * Set up application routes
	 */
	initializeRoutes = () => {
		this.routeManager = new RouteManager(this.ENV);
		this.app.use("/", this.routeManager.getRoutes());
	};

	/**
	 * Handle 404 and server errors
	 */
	initializeErrorHandling = () => {
		this.app.use(this.responder.handle404Error);       // Unmatched routes
		this.app.use(this.responder.handleGeneralError);   // Server/internal errors
	};

	/**
	 * Log app startup
	 */
	appIsListening = () => {
		this.logger.info(`[${this.name}] 🚀 Server is running on port ${this.port}`);
	};

	/**
	 * Start the server
	 */
	start = async (port) => {
		try {
			this.port = port;

			// Call Python environment setup before anything else
			await this.initializePythonEnvironment();

			this.initializeMiddleware();
			this.initializeRoutes();
			this.initializeErrorHandling();

			this.server.listen(port, this.appIsListening);
		} catch (error) {
			this.logger.error(`❌ Failed to start the application:`, { error });
			process.exit(1); // Exit process on critical failure
		}
	};
}

module.exports = Application;
