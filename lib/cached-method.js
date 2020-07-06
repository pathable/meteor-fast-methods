import { ValidatedMethod } from 'meteor/mdg:validated-method';

export class CachedValidatedMethod extends ValidatedMethod {
  constructor(options) {
    super(options);
    const run = this.run;
    this.run = function (args) {
      if (this.isSimulation) {
        return run.bind(this)(args);
      }
      import { cacheKey } from './helpers';
      import { getRedisPusher } from 'meteor/cultofcoders:redis-oplog';

      const keyName = cacheKey(this.name, args);

      const cachedResponse = FastMethods.redisClient.get(keyName);
      if (cachedResponse) {
        return cachedResponse;
      }
      const result = run.bind(this)(args);
      const timeInSecond = 'EX';
      const time = 200;
      getRedisPusher.set(keyName, result, timeInSecond, time);
      return result;
    };
  }
}
