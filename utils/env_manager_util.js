const fs 	= require("fs");
const path 	= require("path");
const yaml 	= require("js-yaml");
const axios = require("axios");

class EnvManagerUtil {
	constructor(yaml_env_file_path = path.join(__dirname, "../", "env.yaml")) {
		this.base_dir 				= process.cwd();
		this.yaml_env_file_path 	= path.join(this.base_dir, "env.yaml");

		this.env_data = this.#readENVData();
	}

	// Private method to read from env.yaml
	#readENVData = () => {
		if (!fs.existsSync(this.yaml_env_file_path)) {
			console.warn(`YAML file not found at: ${this.yaml_env_file_path}`);
			return {};
		}

		try {
			const file_content 	= fs.readFileSync(this.yaml_env_file_path, 'utf8');
			const data 			= yaml.load(file_content);
			return data || {};
		} 
		catch (err) {
			console.error('Failed to read YAML file:', err);
			return {};
		}
	}

	// Method to get a variable from env.yaml or fallback to process.env
	getEnvVar = (key, default_value = undefined) => {
		if (key in this.env_data) return this.env_data[key];

		if (key in process.env) return process.env[key];

		return default_value;
	}

	// Method to load remote env variables from a JSON endpoint
	fetchRemoteEnv = async (url) => {
		try {
			const response = await axios.get(url);

			if (typeof response.data === 'object') {

				// Merge remote env vars into env_data (local override)
				this.env_data = {...this.env_data, ...response.data };
				console.log('Remote env variables loaded.');

			} 
			else {
				console.warn('Unexpected response format from remote env endpoint.');
			}
		} catch (err) {
			console.error('Failed to fetch remote env variables:', err.message);
		}
	}
}

module.exports = EnvManagerUtil;
