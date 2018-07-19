const fp = require('mostly-func');
const { helpers } = require('mostly-feathers-validate');

module.exports = function accepts (context) {
  // validation rules
  const action = { arg: 'action', type: 'string', required: true, description: 'Action id' };
  const variables = { arg: 'variables', type: 'object', default: {}, description: 'Variables of action' };

  return {
    create: [ action, variables ]
  };
};