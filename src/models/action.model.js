const { plugins } = require('mostly-feathers-mongoose');
const { schemas: contents } = require('playing-content-common');
const { schemas: rules } = require('playing-rule-common');

const options = {
  timestamps: true
};

/**
 * Actions are a way of capturing player events/actions.
 */
const fields = {
  name: { type: String, required: true },    // name for the action
  description: { type: String },             // brief description of the action
  image: contents.blob.schema,               // image which represents the action
  chance: { type: Number, default: 100 },    // probability percentage that the player gets the rewards on completing the action
  rate: rules.rate.schema,                   // rate limiting of the action
  requires: rules.requires.schema,
  rules: [{                                  // rules to be evaluated to give rewards to the player
    rewards: rules.rewards.schema,           // metrics that a player gets when he finishes the action
    requires: rules.requires.schema          // conditions which are checked to see if the player is suitable to get this reward
  }],
  variables: rules.variables.schema,         // variables available within the action
  tags: [{ type: String }],                  // the tags of the rule
};

module.exports = function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.plugin(plugins.trashable);
  return mongoose.model(name, schema);
};
module.exports.schema = fields;
