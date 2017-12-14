// reward structure
const reward = {
  metric: {                                  // the metric which will be used for the reward
    id: { type: 'ObjectId' },                // ID of the metric
    type: { type: 'String' },                // type of the metric
  },
  probabilty: { type: 'Number' },            // chance [0, 1] that this reward in an action or process task can be given
  verb: { type: 'String', enum: ['add', 'remove', 'set'] }, // operation is performed for this reward
  value: { type: 'String' }                  // value by which the player's score changes
};

export default { reward }
