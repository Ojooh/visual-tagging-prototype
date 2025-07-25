const express                   = require('express');
const ImageTaggerRouter         = require("./image_tagger_router");

class BaseAPIRouter {
    constructor(env_variables) {
        this.router               = express.Router();
        this.image_tagger_router  = new ImageTaggerRouter(env_variables);

        // Initialize routes
        this.initializeRoutes();
    }

    initializeRoutes = () => {
        this.#nameRoute("/image-tagger", this.image_tagger_router.getRoutes(), "image_tagger_routes");
    }

    getRoutes = () => { return this.router; }

    #nameRoute = (base_path, sub_router, group_name) => {
		this.router.use(base_path, sub_router);

		// Find the last added layer (the sub-router mount layer)
		const layer = this.router.stack[this.router.stack.length - 1];

		// Add `route_module` to all sub-routes inside this sub-router
		if (layer?.handle?.stack?.length) {
			for (const sub_layer of layer.handle.stack) {
				sub_layer.route_module = group_name;
				sub_layer.base_path = base_path;
			}
		}
	};
}

module.exports = BaseAPIRouter;
