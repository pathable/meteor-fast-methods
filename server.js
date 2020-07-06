import redis from 'redis';
FastMethods = {};
FastMethods.redisClient = redis.createClient(Meteor.settings.redisOplog.redis);

import { EJSON } from 'meteor/ejson';
import {
  CHANGES_METHOD_NAME,
  CHANGES_NAMESPACE,
  reduceToMethodSubscriptionFormat,
} from './lib/helpers';
import { Vent } from 'meteor/cultofcoders:redis-oplog';
import { onPageLoad } from 'meteor/server-render';
import './lib/mongo-collections-map';
export { CachedValidatedMethod } from './lib/cached-method';
export function preloadData(cursorsFunction) {
  onPageLoad(sink => {
    const cursors = cursorsFunction(sink);

    cursors.forEach(cursor => {
      Mongo.Collection.__getCollectionByName(
        cursor._getCollectionName()
      ).shouldEmitEvents = true;
    });
    sink.appendToBody(
      `<script>var PRELOADED_DATA_METEOR_FAST_METHODS = ${EJSON.stringify(
        reduceToMethodSubscriptionFormat(cursors)
      )}</script>`
    );
  });
}
Vent.publish(CHANGES_METHOD_NAME, function publication() {
  this.on(CHANGES_NAMESPACE, doc => doc);
});
