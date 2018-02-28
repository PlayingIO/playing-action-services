import fp from 'mostly-func';
import { helpers as rules } from 'playing-rule-services';

export const fulfillActionRequires = (action, user) => {
  return rules.fulfillRequires(action.rules, action.variables, user);
};

export const fulfillActionRewards = (action, user) => {
  return rules.fulfillCustomRewards(action.rules, action.variables, user);
};

export const getActionRewards = (action) => {
  return fp.flatten(fp.map(rule => {
    return (rule.rewards || []).map(reward => {
      reward.type = reward.metric && reward.metric.type;
      reward.metric = reward.metric && reward.metric.id || reward.metric;
      return reward;
    });
  }, action.rules));
};