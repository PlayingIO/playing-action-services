import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';
import { models as contents } from 'playing-content-services';

import { rate } from './rate-schema';
import { requires } from './requires-schema';
import { reward } from './reward-schema';
import { variable } from './variable-schema';

/*
 * Actions are a way of capturing player events/actions.
 */
const fields = {
  name: { type: 'String', required: true },  // name for the action
  description: { type: 'String' },           // brief description of the action
  image: contents.blob.schema,               // image which represents the action
  probability: { type: 'Number' },           // probability that the player gets the rewards on completing the action
  rate: rate,                                // rate limiting an action
  requires: requires,
  rules: [{                                  // rules to be evaluated to give rewards to the player
    rewards: [reward],                       // metrics that a player gets when he finishes this action
    requires: requires                       // conditions which are checked to see if the player is suitable to get this reward
  }],
  variables: [variable]
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields);
  schema.plugin(timestamps);
  schema.plugin(plugins.softDelete);
  return mongoose.model(name, schema);
}

model.schema = fields;