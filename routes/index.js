const express                   = require("express");

const BaseAPIRouter             = require("./api_router/base_api_router.js");
const ViewsRouter               = require("./views_router/base_view_router.js");

class RouteManager {
    constructor(env_variables) {
        this.route_groups           = {}; 
        this.router                 = express.Router();
        this.api_router             = new BaseAPIRouter(env_variables);   
        this.views_router           = new ViewsRouter(env_variables);                 

        // Initialize routes
        this.initializeRoutes();
    }


    initializeRoutes = () => {
        this.#nameRoute("/api/", this.api_router.getRoutes(), "api_router");

        this.#nameRoute("/", this.views_router.getRoutes(), "client_views");

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

module.exports = RouteManager;