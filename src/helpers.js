import fp from 'mostly-func';
import { helpers as rules } from 'playing-rule-services';

export const fulfillActionRewards = (action) => {
  return rules.fulfillRewards(action.rules);
};

export const getActionRewards = (action) => {
  fp.flatten(fp.map(rule => {
    return (rule.rewards || []).map(reward => {
      reward.type = reward.metric && reward.metric.type;
      reward.metric = reward.metric && reward.metric.id || reward.metric;
      return reward;
    });
  }, action.rules));
};