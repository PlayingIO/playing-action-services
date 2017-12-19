// rate structure
const rate = {
  count: { type: 'Number' },                 // number of times the player can perform this action within the window
  timeframe: { type: 'Number' },             // milliseconds of the window or timeframe
  type: { type: 'String', enum: [            // type of rate limiting being used
    'rolling',                               // rolling window rate limit
    'fixed',                                 // fixed window rate limit
    'leaky'                                  // leaky bucket algorithm
  ] },
};

export default { rate }