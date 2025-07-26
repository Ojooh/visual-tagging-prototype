const express                   = require('express');
const ClientViewController      = require("../../controllers/client_view_controller");

class ViewsRouter {
    constructor(helper_util) {
        this.router         = express.Router();
        this.controller     = new ClientViewController(helper_util);

        // Initialize routes
        this.initializeRoutes();
    }


    initializeRoutes = () => {
       this.router.get("/", this.controller.viewImageTaggerUI);

       this.router.get("/dashboard", this.controller.viewImageTaggerUI);

       this.router.get("/upload", this.controller.viewImageTaggerUI);
    }

    getRoutes = () => { return this.router; }
}

module.exports = ViewsRouter;
