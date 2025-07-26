const LoggerUtil             = require("../utils/logger_util");
const ImageTaggerService     = require("../modules/image_tagger/image_tagger_service");

class ImageTaggerController {
	constructor(env_variables) {
		this.name     = "image_tagger_controller";
		this.logger   = new LoggerUtil(this.name, env_variables);
		this.service  = new ImageTaggerService(env_variables);
	}

	// Upload images
	uploadImages = async (req, res) => {
		const start_time = process.hrtime();
		try {
			const { files } = req;
			const session_id = req?.cookies_object?.session_id;

			const image_files = Array.isArray(files.images) ? files.images : [files.images];
			const { status, msg, data } = await this.service.uploadImages(session_id, image_files);

			if (!status) return res.errResponse(400, msg);

			return res.successResponse(201, msg, data);
		} catch (error) {
			this.logger.error(`[${this.name}] Error in uploadImages controller`, { error });
			return res.errResponse(500, "upload_error");
		} finally {
			this.logger.logExecutionTime(start_time, this.name, "uploadImages");
		}
	};

	// Get all images for a session
	getSessionImages = async (req, res) => {
		const start_time = process.hrtime();
		try {
			const session_id = req?.cookies_object?.session_id;

			const { status, msg, data } = await this.service.getSessionImages(session_id);

			if (!status) return res.errResponse(400, msg);

			return res.successResponse(200, msg, data);
		} catch (error) {
			this.logger.error(`[${this.name}] Error in getSessionImages controller`, { error });
			return res.errResponse(500, "fetch_failed");
		} finally {
			this.logger.logExecutionTime(start_time, this.name, "getSessionImages");
		}
	};

	// Analyze specific image IDs
	analyzeImagesByIds = async (req, res) => {
		const start_time = process.hrtime();
		try {
			const session_id = req?.cookies_object?.session_id;
			const { image_ids } = req.body;

			const { status, msg, data } = await this.service.analyzeImagesByIds(session_id, image_ids);

			if (!status) return res.errResponse(400, msg);

			return res.successResponse(200, msg, data);
		} catch (error) {
			this.logger.error(`[${this.name}] Error in analyzeImagesByIds controller`, { error });
			return res.errResponse(500, "analyze_failed");
		} finally {
			this.logger.logExecutionTime(start_time, this.name, "analyzeImagesByIds");
		}
	};
}

module.exports = ImageTaggerController;
