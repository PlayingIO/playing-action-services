import { helpers } from 'mostly-feathers-mongoose';
import { helpers as rules } from 'playing-rule-services';

export const fulfillActionRequires = (action, user) => {
  const variables = rules.parseVariables(action.variables);
  return rules.fulfillRequires(user, variables, action.requires);
};

export const fulfillActionRewards = (action, user) => {
  const variables = rules.parseVariables(action.variables);
  return rules.fulfillCustomRewards(action.rules, variables, user);
};

// create a user action activity
export const createActionActivity = (context, userAction, custom) => {
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