import fp from 'mostly-func';
import { helpers as rules } from 'playing-rule-services';

export const fulfillActionRewards = (action) => {
  return rules.fulfillRewards(action.rules);
};