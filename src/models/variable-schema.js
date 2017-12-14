// variable structure
const variable = {                           // dynamic contents for evaluating rules when an action is performed
  name: { type: 'String' },                  // name of the variable
  type: { type: 'String', enum:['string', 'number'] }, // type of the variable
  required: { type: 'Boolean' },             // whether the variable is required
  default: { type: 'String' },               // default value of the variable
};

export default { variable }