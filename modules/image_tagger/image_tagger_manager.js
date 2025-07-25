const fs                  = require("fs");
const path                = require("path");
const crypto              = require("crypto");

const LoggerUtil          = require("../../utils/logger_util");
const PythonBridgeManager = require("../python_image_tagger_analyzer/python_bridge_manager");
const InMemoryQueue       = require("./in_memory_analysis_queue");

class ImageTaggerManager {
	constructor(env_variables) {
		this.name               = "image_tagger_manager";
		this.ENV                = env_variables;
		this.base_dir           = process.cwd();

		this.upload_dir         = path.join(this.base_dir, "local_uploads", "image_file_uploads");
		this.json_db_directory  = path.join(this.base_dir, "database", "image_file_tag_results");
		this.metadata_path      = path.join(this.json_db_directory, "file_metadata_db.json");
		this.cache_db_path      = path.join(this.json_db_directory, "image_tags_cache.json");

		this.logger             = new LoggerUtil(this.name, this.ENV);
		this.python_analyzer    = new PythonBridgeManager(this.ENV);
		this.analysis_queue     = new InMemoryQueue(env_variables, this.python_analyzer, this);

		this.#ensureDirExist(this.upload_dir);
		this.#ensureDirExist(this.json_db_directory);

		this.cache              = this.#loadCacheFromFile();
		this.locking            = false;
		this.metadata           = this.#loadMetadataFromFile();
	}

	// Method to save uploaded images
	saveUploadedImages = async (session_id, image_files) => {
		const saved_paths = [];

		for (const file of image_files) {
			const original_name = file?.name || "unknown.jpg";
			const unique_name   = this.#generateFileName(original_name);
			const full_path     = path.join(this.upload_dir, unique_name);
			const file_data 	= file.data || file?.buffer || fs.readFileSync(file.path);

			fs.writeFileSync(full_path, file_data);

			const image_id 					= crypto.randomUUID();
			const url_path 					= `${this.ENV?.BASE_URL}/local_uploads/image_file_uploads/${unique_name}`;
			const now 						= new Date().toISOString();
			console.log({ metadata: this.metadata})
			this.metadata.images[image_id] 	= { 
				image_id, session_id, url_path, file_path: full_path, tags: null, 
				created_at: now, updated_at: now 
			};

			saved_paths.push({ image_id, file_path: full_path });
		}

		await this.#writeMetadataToFile();
		return saved_paths;
	};

	// Method to get all uploaded images by session id
	getAllSessionImages = async (session_id) => {
		return Object.values(this.metadata.images)
			.filter(img => img.session_id === session_id)
			.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
	};

	// Method to get upload images by paths
	getImagePathsByIds = async (session_id, image_ids) => {
		const paths = [];

		for (const id of image_ids) {
			const entry = this.metadata.images[id];
			if (entry && entry.session_id === session_id) {
				paths.push(entry.file_path);
			}
		}

		return paths;
	};

	// Method to get tags from cache
	getTagsFromCache = async (image_paths) => {
		const result = {};
		for (const image_path of image_paths) {
			const hash = this.generateHash(image_path);
			result[image_path] = this.cache[hash] || null;
		}
		return result;
	};

	// Method to get cached and uncached results
	getCachedAndUnCachedResults = async (cached_result, image_paths) => {
		const cached_results = [];
		const uncached_paths = [];

		for (const path of image_paths) {
			const cached_tags = cached_result[path];
			if (cached_tags) {
				cached_results.push({ image_path: path, tags: cached_tags, cached: true });
			} 
			else { uncached_paths.push(path);}
		}

		return { cached_results, uncached_paths };
	};

	// Method to add images to in memory queue for batch processing
	runImageAnalysisWithPython = async (image_paths) => {
		try {
			// Push images to the queue and wait for batch processing
			return await this.analysis_queue.enqueue(image_paths);
		}
		catch(error){
			this.logger.error(`[${this.name}] Error in method runImageAnalysisWithPython`, { error });
			return false;
		}
		
	};

	// Method to save processed image tags to cache memory
	saveTagsToCache = async (tag_map) => {
		for (const [image_path, tags] of Object.entries(tag_map)) {
			const hash = this.generateHash(image_path);
			this.cache[hash] = tags;

			// Update metadata
			const image_entry = Object.values(this.metadata.images).find(img => img.file_path === image_path);
			if (image_entry) {
				image_entry.tags = tags;
				image_entry.updated_at = new Date().toISOString();
			}
		}
		await this.#writeCacheToFile();
		await this.#writeMetadataToFile();
	};

	// Method to hash image data
	generateHash = (image_path) => {
		const buffer = fs.readFileSync(image_path);
		return crypto.createHash("sha256").update(buffer).digest("hex");
	};

	// ----------- PRIVATE HELPERS ----------- //

	#generateFileName = (original_name) => {
		return `${Date.now()}_${Math.random().toString(36).substring(2)}_${original_name}`;
	};

	
	#ensureDirExist = (dir) => {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	};

	#loadCacheFromFile = () => {
		try {
			if (fs.existsSync(this.cache_db_path)) {
				const raw = fs.readFileSync(this.cache_db_path, "utf-8");
				return JSON.parse(raw);
			}
			return {};
		} catch (error) {
			this.logger.error(`[${this.name}] Error loading tag cache`, { error });
			return {};
		}
	};

	#writeCacheToFile = async () => {
		fs.writeFileSync(this.cache_db_path, JSON.stringify(this.cache, null, 4));
	};

	#loadMetadataFromFile = () => {
		try {
			if (fs.existsSync(this.metadata_path)) {
				const raw = fs.readFileSync(this.metadata_path, "utf-8");
				return JSON.parse(raw);
			}
			return { images: {} };
		} catch (error) {
			this.logger.error(`[${this.name}] Error loading metadata`, { error });
			return { images: {} };
		}
	};

	#writeMetadataToFile = async () => {
		while (this.locking) await new Promise(res => setTimeout(res, 10)); // Wait for lock
		this.locking = true;
		try {
			fs.writeFileSync(this.metadata_path, JSON.stringify(this.metadata, null, 4));
		} catch (error) {
			this.logger.error(`[${this.name}] Error writing metadata`, { error });
		} finally {
			this.locking = false;
		}
	};
}

module.exports = ImageTaggerManager;
