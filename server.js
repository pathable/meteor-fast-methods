import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { getRedisListener } from 'meteor/cultofcoders:redis-oplog';
import { EJSON } from 'meteor/ejson';
import {
  CHANGES_METHOD_NAME,
  CHANGES_NAMESPACE,
  reduceToMethodSubscriptionFormat,
} from './lib/helpers';
import { Vent } from 'meteor/cultofcoders:redis-oplog';
import { onPageLoad } from 'meteor/server-render';
import './lib/mongo-collections-map';

export function preloadData(cursorsFunction) {
  onPageLoad(sink => {
    const cursors = cursorsFunction(sink);
    console.log(cursors);

    cursors.forEach(cursor => {
      Mongo.Collection.__getCollectionByName(cursor._getCollectionName()).shouldEmitEvents = true;
    });
    sink.appendToHead(
      `<script>var PRELOADED_DATA_METEOR_FAST_METHODS = ${EJSON.stringify(
        reduceToMethodSubscriptionFormat(cursors)
      )}</script>`
    );
  });
}
Vent.publish(CHANGES_METHOD_NAME, function publication() {
  this.on(CHANGES_NAMESPACE, doc => doc);
});

export class CachedValidatedMethod extends ValidatedMethod {
  constructor(options) {
    super(options);
    const run = this.run;
    this.run = function (args) {
      if (this.isSimulation) {
        return run.bind(this)(args);
      }
      const keyName = cacheKey(this.name, args);
      const cachedResponse = getRedisListener().get(keyName);
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
