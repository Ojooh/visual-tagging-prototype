const express                = require("express");
const ImageTaggerController = require("../../controllers/image_tagger_controller");

class ImageTaggerRouter {
	constructor(env_variables) {
		this.controller = new ImageTaggerController(env_variables);
		this.router     = express.Router();

		this.initializeRoutes();
	}

	initializeRoutes = () => {
		// Upload images (expects session_id in body and multipart files)
		this.router.post("/upload", this.controller.uploadImages);

		// Fetch all uploaded images for a session
		this.router.get("/images", this.controller.getSessionImages);

		// Analyze selected image IDs (expects session_id and image_ids in body)
		this.router.post("/analyze", this.controller.analyzeImagesByIds);
	};

	getRoutes = () => {
		return this.router;
	};
}

module.exports = ImageTaggerRouter;
