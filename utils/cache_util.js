// originCache.js
const NodeCache = require("node-cache");

// Shared instance
const OriginCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });


module.exports = {
    OriginCache,
}
