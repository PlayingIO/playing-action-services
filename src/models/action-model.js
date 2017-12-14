import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';
import { models as contents } from 'playing-content-services';

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
  rate: {                                    // array of limitings of an action
    count: { type: 'Number' },               // number of times the player can perform this action within the window
    timeframe: { type: 'Number' },           // milliseconds of the window or timeframe
    type: { type: 'String', enum: ['rolling', 'fixed', 'leaky'] }, // type of rate limiting being used
  },
  requires: requires,
  rules: [{
    rewards: [reward],
    requires: requires
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