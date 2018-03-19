import fp from 'mostly-func';
import { helpers } from 'mostly-feathers-mongoose';
import { helpers as rules } from 'playing-rule-services';

export const fulfillActionRequires = (action, user) => {
  return rules.fulfillRequires(user, action.variables, action.requires);
};

export const fulfillActionRewards = (action, user) => {
  return rules.fulfillCustomRewards(action.rules, action.variables, user);
};

export const flattenActionRewards = (action) => {
  return fp.flatMap(rule => {
    return (rule.rewards || []).map(reward => {
      reward.type = reward.metric && reward.metric.type;
      reward.metric = reward.metric && helpers.getId(reward.metric);
      return reward;
    });
  }, action.rules);
};