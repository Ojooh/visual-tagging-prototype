
const LoggerUtil          = require("../../utils/logger_util");

class InMemoryQueue {
	constructor(env_variables, python_analyzer, manager) {
		this.name               = "in_memory_queue";
		this.ENV                = env_variables;
		this.python_analyzer    = python_analyzer;
		this.manager            = manager;
		this.queue              = new Set();
		this.is_processing      = false;
		this.delay_ms           = 300;
		this.logger             = new LoggerUtil(this.name, this.ENV);

		this.#startQueueWorker();
	}

	enqueue = async (image_paths) => {
		try {
			image_paths.forEach(p => this.queue.add(p));
			return true; // instantly return
		} catch (error) {
			this.logger.error(`[${this.name}] Error in enqueue`, { error });
			return false;
		}
	};

	#startQueueWorker = () => {
		setInterval(async () => {
			if (this.is_processing || this.queue.size === 0) return;

			this.is_processing = true;
			const paths = Array.from(this.queue);
			this.queue.clear();

			try {
				const tag_map = await this.python_analyzer.run(paths);
				await this.manager.saveTagsToCache(tag_map);
				this.logger.info(`[${this.name}] Processed ${paths.length} image(s)`);
			} catch (err) {
				this.logger.error(`[${this.name}] Error in batch processing`, { error: err });
			} finally {
				this.is_processing = false;
			}
		}, this.delay_ms);
	};
}

module.exports = InMemoryQueue;
