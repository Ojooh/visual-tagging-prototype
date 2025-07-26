const LoggerUtil                = require("../utils/logger_util");

class ClientViewController {
    constructor(env_variables) {
        this.name       = "client_view_controller";
        this.ENV        = env_variables
        this.logger     = new LoggerUtil(this.name, this.helper?.ENV);
    }

    // Method to view the API Tester UI
    viewImageTaggerUI = async (req, res) => {
        const start_time = process.hrtime();
        try  {
            return res.render("index", { });
        }
        catch (error) {
            this.logger.error(`[${this.name}] Error in viewImageTaggerUI controller`, { error });
            return res.errResponse(500, 'invalid_error_request');
        }
        finally { this.logger.logExecutionTime(start_time, this.name, "viewImageTaggerUI")}
    }

}

module.exports = ClientViewController