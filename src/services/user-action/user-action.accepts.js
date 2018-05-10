import fp from 'mostly-func';
import { helpers } from 'mostly-feathers-validate';

export default function accepts (context) {
  // validation rules
  const action = { arg: 'action', type: 'string', required: true, description: 'Action id' };
  const variables = { arg: 'variables', type: 'object', default: {}, description: 'Variables of action' };
  
  return {
    create: [ action, variables ]
  };
}
