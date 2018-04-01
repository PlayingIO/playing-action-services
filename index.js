require = require("esm")(module/*, options*/);
console.time('playing-action-services import');
module.exports = require('./src/index').default;
module.exports.entities = require('./src/entities').default;
module.exports.models = require('./src/models').default;
module.exports.helpers = require('./src/helpers');
console.timeEnd('playing-action-services import');
