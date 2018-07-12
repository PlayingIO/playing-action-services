const { helpers } = require('mostly-feathers-mongoose');
const rules = require('playing-rule-common');

const fulfillActionRequires = (action, user) => {
  const variables = rules.parseVariables(action.variables);
  return rules.fulfillRequires(user, variables, action.requires);
};

const fulfillActionRewards = (action, user) => {
  const variables = rules.parseVariables(action.variables);
  return rules.fulfillCustomRewards(action.rules, variables, user);
};

// create a user action activity
const createActionActivity = (context, userAction, custom) => {
  const actor = helpers.getId(userAction.user);
  const action = helpers.getId(userAction.action);
  return {
    actor: `user:${actor}`,
    object: `action:${action}`,
    foreignId: `userAction:${userAction.id}`,
    time: new Date().toISOString(),
    ...custom
  };
};

module.exports = {
  createActionActivity,
  fulfillActionRequires,
  fulfillActionRewards
};