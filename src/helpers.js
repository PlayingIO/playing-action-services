import fp from 'mostly-func';
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
