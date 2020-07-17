import redis from 'redis';
import { Meteor } from 'meteor/meteor';
import { Context } from './lib/context';

FastMethods = {
  fastMethodsContext: new Meteor.EnvironmentVariable(),
};
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
    const loginToken = sink.request.cookies['meteor_login_token'];

    const context = new Context(loginToken, { headers: sink.request.headers });
    FastMethods.fastMethodsContext.withValue(context, function () {
      const cursors = cursorsFunction.call(context, sink);

      cursors.forEach(cursor => {
        Mongo.Collection.__getCollectionByName(
          cursor._getCollectionName()
        ).shouldEmitEvents = true;
      });
      sink.appendToBody(
        `<script>
        var PRELOADED_DATA_METEOR_FAST_METHODS = JSON.parse(
          unescape("${escape(
            EJSON.stringify(reduceToMethodSubscriptionFormat(cursors))
          )}")
        );
        var METEOR_FAST_METHODS_INITIAL_LOGGED_IN = ${!!context.userId};
        </script>`
      );
    });
  });
}
Vent.publish(CHANGES_METHOD_NAME, function publication({ namespace }) {
  this.on(CHANGES_NAMESPACE(namespace), doc => doc);
});
