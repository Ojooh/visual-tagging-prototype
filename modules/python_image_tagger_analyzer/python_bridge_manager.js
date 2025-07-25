const { spawnSync, spawn } 	= require("child_process");
const path 					= require("path");
const fs 					= require("fs");
const os 					= require("os");

const LoggerUtil = require("../../utils/logger_util");

class PythonBridgeManager {
	constructor(env_variables) {
		this.name 				= "python_bridge_manager";
		this.ENV 				= env_variables;
		this.logger 			= new LoggerUtil(this.name, this.ENV);

		this.base_dir 			= process.cwd();
		this.venv_dir 			= path.join(this.base_dir, "modules", "python_image_tagger_analyzer", "env");
		this.script_path 		= path.join(this.base_dir, "modules", "python_image_tagger_analyzer", "ml_processor_batch.py");

		this.required_packages 	= ["torch", "torchvision", "transformers", "pillow"];
		this.output 			= "";
		this.error 				= "";
		this.setPlatformPaths();
	}

	// Set correct path to pip/python based on OS
	setPlatformPaths = () => {
		const iswindows = os.platform() === "win32";

		this.python_path = iswindows ? path.join(this.venv_dir, "Scripts", "python.exe") : path.join(this.venv_dir, "bin", "python3");

		this.pip_path = iswindows ? path.join(this.venv_dir, "Scripts", "pip.exe") : path.join(this.venv_dir, "bin", "pip3");
	}

	// Initialization: check or create venv, install packages
	initialize = async () => {
		if (!fs.existsSync(this.python_path)) { 
			this.logger.info("Virtualenv not found. Creating...");

			const result = spawnSync("python3", ["-m", "venv", this.venv_dir]);

			if (result.status !== 0) {
				this.logger.error("Failed to create virtual environment.");
				throw new Error("Failed to create Python virtual environment.");
			}
		}

		await this.installPythonDependencies();
	};

	// Install dependencies using venv pip
	installPythonDependencies = () => {
		return new Promise((resolve, reject) => {
			const pip_args 			= ["install", ...this.required_packages];
			const pip_install 		= spawn(this.pip_path, pip_args);

			pip_install.stdout.on("data", (data) => { this.logger.info(`[${this.name}] [pip install] ${data.toString()}`); });

			pip_install.stderr.on("data", (data) => { this.logger.error(`[${this.name}] [pip install error] ${data.toString()}`, { error: data.toString() });});

			pip_install.on("close", (code) => {
				if (code === 0) resolve();
				else reject(new Error(`pip install process exited with code ${code}`));
			});
		});
	};

	// Run your existing python script with image paths
	run(image_paths) {
		this.output = "";
		this.error 	= "";

		return new Promise((resolve, reject) => {
		const py = spawn(this.python_path, [this.script_path, ...image_paths]);

		py.stdout.on("data", this.onStdout.bind(this));
		py.stderr.on("data", this.onStderr.bind(this));
		py.on("close", this.onClose.bind(this, resolve, reject)); });
	}

	onStdout = (data) => { this.output += data.toString(); }

	onStderr = (data) => { 
		const msg = data.toString();
		// Log warnings but don't treat all stderr as error immediately
		this.logger.warn(`[${this.name}] [stderr] ${msg}`);
		this.error += msg; 
	}

	onClose = (resolve, reject, code) => {
		try {
			if (code !== 0) {
				return reject(new Error(`Python error (exit code ${code}): ${this.error}`));
			}

			// Extract JSON substring from this.output
			const start_marker 	= "###### Pyhton Result start";
			const end_marker 	= "###### Python Result end";
			const start_index 	= this.output.indexOf(start_marker);
    		const end_index 	= this.output.indexOf(end_marker);

			if (start_index === -1 || end_index === -1 || end_index <= start_index) {
				return reject(new Error("Failed to find JSON output markers in Python output"));
			}

			const json_string 	= this.output.substring(start_index + start_marker.length, end_index).trim();
   			const parsed 		= JSON.parse(json_string);

			resolve(parsed);
		} 
		catch (error) {
			reject(new Error(`Failed to parse Python output: ${error}`));
		}
	}
}

module.exports = PythonBridgeManager;
