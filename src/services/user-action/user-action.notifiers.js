const { helpers } = require('mostly-feathers-mongoose');

const { createActionActivity } = require('../../helpers');

// play action activity
const playAction = (context) => {
  const userAction = helpers.getHookData(context);
  const actor = helpers.getCurrentUser(context);
  if (!userAction || !actor) return;

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

module.exports = {
  'action.play': playAction
};

