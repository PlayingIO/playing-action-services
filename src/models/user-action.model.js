import { plugins } from 'mostly-feathers-mongoose';
import { schemas as rules } from 'playing-rule-common';

const options = {
  timestamps: true
};

/**
 * User actions
 */
const fields = {
  action: { type: 'ObjectId', required: true }, // action id
  name: { type: String, required: true },       // action name (for cache)
  count: { type: Number },                      // action count (no default for upsert with $inc)
  limit: { type: rules.limit.schema },          // rate limiting data
  user: { type: 'ObjectId', required: true }    // user id
};

export default function model (app, name) {
  const mongoose = app.get('mongoose');
  const schema = new mongoose.Schema(fields, options);
  schema.plugin(plugins.trashable);
  schema.index({ action: 1, user: 1 }, { unique: true });
  return mongoose.model(name, schema);
}

model.schema = fields;