const {
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_FILE_COUNT,
    MAX_IMAGE_FILE_SIZE
} = require("../../enums/constants.enums");

class ImageTaggerValidator {
	constructor() {}

	// Validate images and their types/sizes
	validateImageInput = (image_files) => {
		if (!Array.isArray(image_files) || image_files.length === 0) {
			return { v_state: false, v_msg: "no_images_provided", v_data: null };
		}

		if (image_files.length > MAX_IMAGE_FILE_COUNT) {
			return { v_state: false, v_msg: `too_many_images_provided_max_${MAX_IMAGE_FILE_COUNT}_allowed`, v_data: null };
		}

		for (let i = 0; i < image_files.length; i++) {
			const file = image_files[i];

			if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
				return { v_state: false, v_msg: `invalid_file_type_at_index_${i}`, v_data: null };
			}

			if (file.size > MAX_IMAGE_FILE_SIZE) {
				return { v_state: false, v_msg: `file_size_exceeds_limit_at_index_${i}`, v_data: null };
			}
		}

		return { v_state: true, v_msg: "images_validated_successfully", v_data: image_files };
	};

	// Validate session ID presence
	validateSessionId = (session_id) => {
		if (!session_id || typeof session_id !== "string") {
			return { v_state: false, v_msg: "invalid_or_missing_session_id" };
		}
		return { v_state: true };
	};

	// Validate image IDs (array of strings)
	validateImageIds = (image_ids) => {
		if (!Array.isArray(image_ids) || image_ids.length === 0) {
			return { v_state: false, v_msg: "no_image_ids_provided" };
		}
		if (!image_ids.every(id => typeof id === "string" && id.trim().length > 0)) {
			return { v_state: false, v_msg: "invalid_image_id_format" };
		}
		return { v_state: true };
	};
}

module.exports = ImageTaggerValidator;
