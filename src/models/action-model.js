import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';
import { models as contents } from 'playing-content-services';

/*
 * Actions are a way of capturing player events/actions.
 */
const requires = {
  type: { type: 'String', enum: ['metric', 'action', 'team', 'and', 'or'] }, // type of condition
  not: { type: 'Boolean' },                 // whether invert the condition
  conditions: [{ type: 'Mixed' }],          // array of conditions joined with an AND or OR operator (for condition type and/or)
  condition: {
    id: { type: 'String' },                 // id of metric/action/team,
    type: { type: 'String' },               // type of metric
    operator: { type: 'String', enum: ['eq', 'ne', 'gt', 'ge', 'lt', 'le'] }, // relational operator
    lhs: { type: 'String' },                // lhs formula
    rhs: { type: 'String' },                // rhs formula
    value: { type: 'String' },              // value of the metric/time
    count: { type: 'String' },              // number of times of the action
    role: { type: 'String' },               // role the player should have
    timeFunc: { type: 'String' },           // time unit to be counted, against a fixed duration
  }
};

const fields = {
  name: { type: 'String', required: true },   // name for the action
  description: { type: 'String' },            // brief description of the action
  image: contents.blob.schema,                // image which represents the action
  probability: { type: 'Number' },            // probability that the player gets the rewards on completing the action
  rate: [{                                    // array of limitings of an action
    count: { type: 'Number' },                // number of times the player can perform this action within the window
    timeframe: { type: 'Number' },            // milliseconds of the window or timeframe
    type: { type: 'String', enum: ['rolling', 'fixed', 'leaky'] }, // type of rate limiting being used
  }],
  requires: requires,
  rules: [{
    rewards: [{
      metric: {                                 // the metric which will be used for the reward
        id: { type: 'ObjectId' },               // ID of the metric
        type: { type: 'String' },               // type of the metric
      },
      probabilty: { type: 'Number' },           // chance [0, 1] that this reward in an action or process task can be given
      verb: { type: 'String', enum: ['add', 'remove', 'set'] }, // operation is performed for this reward
      value: { type: 'String' }                 // value by which the player's score changes
    }],
    requires: requires
  }],
  variables: [{                                // dynamic contents for evaluating rules when an action is performed
    name: { type: 'String' },                  // name of the variable
    type: { type: 'String', enum:['string', 'number'] }, // type of the variable
    required: { type: 'Boolean' },             // whether the variable is required
    default: { type: 'String' },               // default value of the variable
  }]
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields);
  schema.plugin(timestamps);
  schema.plugin(plugins.softDelete);
  return mongoose.model(name, schema);
}

model.schema = fields;