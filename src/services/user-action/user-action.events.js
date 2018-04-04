import makeDebug from 'debug';

const debug = makeDebug('playing:action-services:action:events');

const createActivity = async function (app, userAction, verb, message) {
  const svcFeeds = app.service('feeds');

  const activity = {
    actor: `user:${userAction.user}`,
    verb: verb,
    object: `action:${userAction.action}`,
    foreignId: `userAction:${userAction.id}`,
    message: message,
    count: userAction.count,
    rewards: userAction.rewards
  };

  await Promise.all([
    // add to player's activity log
    svcFeeds.action('addActivity').patch(`user:${userAction.user}`, activity),
    // add to notification stream of the player
    svcFeeds.action('addActivity').patch(`notification:${userAction.user}`, activity)
  ]);
};

// subscribe to action.play events
export default function (app, options) {
  app.trans.add({
    topic: 'playing.events',
    cmd: 'action.play'
  }, (resp) => {
    const userAction = resp.event;
    if (userAction) {
      createActivity(app, userAction, 'action.play', 'Playing an action');
    }
  });
}
