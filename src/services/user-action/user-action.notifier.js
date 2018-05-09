import { helpers } from 'mostly-feathers-mongoose';
import { helpers as feeds } from 'playing-feed-services';

export default function (event) {
  return context => {
    const createActivity = async function (userAction, verb, message) {
      const activity = {
        actor: `user:${userAction.user}`,
        verb: verb,
        object: `action:${userAction.action}`,
        foreignId: `userAction:${userAction.id}`,
        time: new Date().toISOString(),
        message: message,
        count: userAction.count,
        rewards: userAction.rewards
      };
      await feeds.addActivity(context.app, activity,
        `user:${userAction.user}`,         // add to player's activity log
        `notification:${userAction.user}`  // add to notification stream of the player
      );
    };

    const userAction = helpers.getHookData(context);
    switch (event) {
      case 'action.play':
        createActivity(userAction, event, 'Play an action');
        break;
    }
  };
}
