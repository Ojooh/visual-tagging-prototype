const LoggerUtil             = require("../../utils/logger_util");
const ImageTaggerValidator   = require("./image_tagger_validator");
const ImageTaggerManager     = require("./image_tagger_manager");

class ImageTaggerService {
	constructor(env_variables) {
		this.name      = "image_tagger_service";
		this.ENV       = env_variables;
		this.logger    = new LoggerUtil(this.name, this.ENV);
		this.validator = new ImageTaggerValidator();
		this.manager   = new ImageTaggerManager(env_variables);
	}

	// Upload and store images
	uploadImages = async (session_id, image_files) => {
		try {
			const sid_check = this.validator.validateSessionId(session_id);

			if (!sid_check.v_state) return { status: false, msg: sid_check.v_msg };

			const { v_state, v_msg, v_data } = this.validator.validateImageInput(image_files);

			if (!v_state) return { status: false, msg: v_msg };

			const stored_images = await this.manager.saveUploadedImages(session_id, v_data);

			return { status: true, msg: "images_uploaded", data: stored_images };
		} catch (error) {
			this.logger.error(`[${this.name}] uploadImages error`, { error });
			return { status: false, msg: "upload_failed" };
		}
	};

	// Get all uploaded images for a session
	getSessionImages = async (session_id) => {
		try {
			const sid_check = this.validator.validateSessionId(session_id);

			if (!sid_check.v_state) return { status: false, msg: sid_check.v_msg };

			const images = await this.manager.getAllSessionImages(session_id);

			return { status: true, msg: "session_images_fetched", data: images };
		} catch (error) {
			this.logger.error(`[${this.name}] getSessionImages error`, { error });
			return { status: false, msg: "fetch_failed" };
		}
	};

	// Analyze images by ID
	analyzeImagesByIds = async (session_id, image_ids = []) => {
		try {
			// 1. Validate image ID input structure
			const id_check = this.validator.validateImageIds(image_ids);

			if (!id_check.v_state) return { status: false, msg: id_check.v_msg };

			// 2. Get image paths filtered by session
			const image_paths = await this.manager.getImagePathsByIds(session_id, image_ids);

			// 3. Validate: All image_ids must match session ID
			if (image_paths.length !== image_ids.length) {
				return { status: false, msg: "invalid_image_id_or_not_in_session" };
			}

			// 4. Check cache
			const cache_result 							= await this.manager.getTagsFromCache(image_paths);
			const { cached_results, uncached_paths } 	= await this.manager.getCachedAndUnCachedResults(cache_result, image_paths);
			let fresh_results 							= [];

			if (uncached_paths.length > 0) {
				fresh_results = await this.manager.runImageAnalysisWithPython(uncached_paths);

				if (!fresh_results) return { status: false, msg: "analysis_failed" };
			}

			// 6. Return combined result
			const all_results = cached_results;

			return { status: true, msg: "analysis_complete", data: all_results };

		} catch (error) {
			this.logger.error(`[${this.name}] analyzeImagesByIds error`, { error });
			return { status: false, msg: "error_during_analysis" };
		}
	};
}

module.exports = ImageTaggerService;
