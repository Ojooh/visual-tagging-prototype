┣ 📂bin
┃ ┗ 📜www
┣ 📂controllers
┃ ┣ 📜client_view_controller.js
┃ ┗ 📜image_tagger_controller.js
┣ 📂database
┃ ┗ 📂image_file_tag_results
┣ 📂enums
┃ ┗ 📜constants.enums.js
┣ 📂local_uploads
┃ ┗ 📂image_file_uploads
┣ 📂logs
┣ 📂middle_wares
┃ ┣ 📜cookie_manager_middle_ware.js
┃ ┣ 📜cors_manager_middle_ware.js
┃ ┗ 📜responder_middle_ware.js
┣ 📂modules
┃ ┣ 📂image_tagger
┃ ┃ ┣ 📜image_tagger_manager.js
┃ ┃ ┣ 📜image_tagger_service.js
┃ ┃ ┣ 📜image_tagger_validator.js
┃ ┃ ┗ 📜in_memory_analysis_queue.js
┃ ┣ 📂python_image_tagger_analyzer
┃ ┃ ┣ 📂env
┃ ┃ ┣ 📜ml_processor_batch.py
┃ ┃ ┗ 📜python_bridge_manager.js
┃ ┗ 📂tes
┣ 📂routes
┃ ┣ 📂api_router
┃ ┃ ┣ 📜base_api_router.js
┃ ┃ ┗ 📜image_tagger_router.js
┃ ┣ 📂views_router
┃ ┃ ┗ 📜base_view_router.js
┃ ┗ 📜index.js
┣ 📂utils
┃ ┣ 📜cache_util.js
┃ ┣ 📜env_manager_util.js
┃ ┣ 📜global_variable_manager_util.js
┃ ┣ 📜logger_util.js
┃ ┗ 📜server_util.js
┣ 📜.gitignore
┣ 📜app.js
┣ 📜env.yaml
┣ 📜nodemon.json
┣ 📜package.json
┗ 📜README.md
