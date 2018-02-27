import timestamps from 'mongoose-timestamp';
import { plugins } from 'mostly-feathers-mongoose';
import { models as rules } from 'playing-rule-services';

/*
 * User actions
 */
const fields = {
  action: { type: 'ObjectId', required: true }, // action id
  name: { type: String, required: true },       // action name (for cache)
  count: { type: Number },                      // action count (no default for upsert with $inc)
  rewards: rules.rule.rewards,                  // rewards for this action (for cache)
  user: { type: 'ObjectId', required: true }    // user id
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields);
  schema.plugin(timestamps);
  schema.plugin(plugins.softDelete);
  schema.index({ action: 1, user: 1 });
  return mongoose.model(name, schema);
}

model.schema = fields;