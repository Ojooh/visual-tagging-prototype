

const CSRFS_TOKEN_FOR_CONSTANTS = {
    LOGIN: "csrfs_token_for_login_form",
    REGISTER_APP: "csrfs_token_for_register_app_form",
    DATASOURCE: "csrfs_token_for_app_datasource_form",
    APP_SCHEMA: "csrfs_token_for_app_schema_form",
    APP_SCHEMA_ACCESS: "csrfs_token_for_app_schema_access_form",
}



const CLIENT_TIMESTAMP_SKEW = (2 * 60 * 1000) // 2 MINUTES

const LOCAL_ORIGIN_LIST = ["http://localhost:5172", "http://localhost:5173", "http://localhost:3000" ];

const STAGING_ORIGIN_LIST = ["" ];

const PRODUCTION_ORIGIN_LIST = ["" ];

const ALLOWED_IMAGE_TYPES = [ "image/jpeg", "image/png", "image/jpg", "image/webp" ];

const MAX_IMAGE_FILE_COUNT = 5;

const MAX_IMAGE_FILE_SIZE = (5 * 1024 * 1024) // 5 mb

module.exports = {
    CSRFS_TOKEN_FOR_CONSTANTS,
    CLIENT_TIMESTAMP_SKEW,
    LOCAL_ORIGIN_LIST,
    STAGING_ORIGIN_LIST,
    PRODUCTION_ORIGIN_LIST,
    ALLOWED_IMAGE_TYPES,
    MAX_IMAGE_FILE_COUNT,
    MAX_IMAGE_FILE_SIZE
}