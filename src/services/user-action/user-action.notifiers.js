import { helpers } from 'mostly-feathers-mongoose';

import { createActionActivity } from '../../helpers';

// play action activity
const playAction = (context) => {
  const userAction = helpers.getHookData(context);
  if (!userAction) return;
  const actor = context.params.user.id;
  const custom = {
    actor: `user:${actor}`,
    verb: 'action.play',
    message: 'Play an action',
    count: userAction.count,
    rewards: userAction.rewards
  };
  return [
    createActionActivity(context, userAction, custom),
    `user:${actor}`,                 // add to player's activity log
    `notification:${actor}`          // add to player's notification stream
  ];
};

export default {
  'action.play': playAction
};

