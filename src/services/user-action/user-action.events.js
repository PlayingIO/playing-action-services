import makeDebug from 'debug';
import { helpers as feeds } from 'playing-feed-services';

const debug = makeDebug('playing:action-services:action:events');

const createActivity = async function (app, userAction, verb, message) {
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
    feeds.createActivity(app, 'feeds')(`user:${userAction.user}`, activity),
    // add to notification stream of the player
    feeds.createActivity(app, 'notifications')(`user:${userAction.user}`, activity),
  ]);

};

// subscribe to action.play events
export default function (app, options) {
  app.trans.add({
    pubsub$: true,
    topic: 'playing.events',
    cmd: 'action.play'
  }, (resp) => {
    const userAction = resp.event;
    if (userAction) {
      debug('action.play event', userAction.action, userAction.user);
      createActivity(app, userAction, 'action.play', 'Playing an action');
    }
  });
}
