export const logLevels = [
  'silly',
  'input',
  'verbose',
  'prompt',
  'debug',
  'info',
  'data',
  'help',
  'warn',
  'error',
];
export function shouldEnableSend() {
  return !!Meteor.settings?.public?.packages?.logs?.env;
}
