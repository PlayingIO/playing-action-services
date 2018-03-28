import makeDebug from 'debug';

const debug = makeDebug('playing:action-services:action:events');

const createActivity = async function (app, userAction, verb, message) {
  const svcFeeds = app.service('feeds');
  const svcNotificationFeeds = app.service('notification-feeds');

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
    //svcNotificationFeeds.action('addActivity').patch(`user:${userAction.user}`, activity)
  ]);
};

// subscribe to action.play events
export default function (app, options) {
  app.trans.add({
    topic: 'playing.events',
    cmd: 'action.played'
  }, (resp) => {
    const userAction = resp.event;
    if (userAction) {
      debug('action.played event', userAction.action, userAction.user);
      createActivity(app, userAction, 'action.played', 'Playing an action');
    }
  });
}
