import { helpers } from 'mostly-feathers-mongoose';
import { helpers as feeds } from 'playing-feed-services';

export default function (event) {
  return context => {
    const createActivity = async function (result, verb, message) {
      const activity = {
        actor: `user:${result.user}`,
        verb: verb,
        object: `action:${result.action}`,
        foreignId: `userAction:${result.id}`
      };
      const extra = {
        message: message,
        count: result.count,
        rewards: result.rewards
      };
      await feeds.addActivity(context.app, activity, extra).feeds(
        `user:${result.user}`,         // add to player's activity log
        `notification:${result.user}`  // add to notification stream of the player
      );
    };

    const result = helpers.getHookData(context);
    switch (event) {
      case 'action.play':
        createActivity(result, event, 'Play an action');
        break;
    }
  };
}
