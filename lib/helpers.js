import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import throttle from 'lodash.throttle';
import keys from 'lodash.keys';

export const CHANGES_NAMESPACE = 'CHANGES_NAMESPACE';
export const CACHE_BY_COLLECTION_NAME = collectionName =>
  `${collectionName}_CACHE`;
export const CHANGES_METHOD_NAME = 'CHANGES_METHOD_NAME';
export function reduceToMethodSubscriptionFormat(arrayOfCursors) {
  return arrayOfCursors.reduce((returnValue, cursor) => {
    const args = cursor._cursorDescription.selector;
    let result;
    const keyName = cacheKey(
      CACHE_BY_COLLECTION_NAME(cursor._getCollectionName()),
      args
    );
    const cachedResponse = getFromRedis(keyName);
    if (cachedResponse) {
      result = EJSON.parse(cachedResponse);
    } else {
      const fetch = cursor.fetch();
      result = fetch.map(doc => ({ ...doc, disallowReset: true }));
      const timeInSecond = 'EX';
      const time = 200;
      setOnRedis(keyName, EJSON.stringify(result), timeInSecond, time);
    }
    return {
      ...returnValue,
      [cursor._getCollectionName()]: result,
    };
  }, {});
}

export function getFromRedis(keyName) {
  return Meteor.wrapAsync(
    FastMethods.redisClient.get.bind(FastMethods.redisClient)
  )(keyName);
}
export function setOnRedis() {
  import { getRedisPusher } from 'meteor/cultofcoders:redis-oplog';
  return getRedisPusher().set(...arguments);
}
export const invalidateCollectionQueries = (collection, wait = 100) =>
  throttle(() => {
    keys(collection._collection.queries).forEach(qid => {
      const query = collection._collection.queries[qid];
      if (query) collection._collection._recomputeResults(query);
    });
    collection._collection._observeQueue.drain();
  }, wait);

export function fillMiniMongo() {
  if (typeof PRELOADED_DATA_METEOR_FAST_METHODS === 'undefined') return;
  const result = PRELOADED_DATA_METEOR_FAST_METHODS;
  const filled = {};
  for (const collectionName of Object.keys(result)) {
    filled[collectionName] = false;
    const populateCollection = () => {
      const collection = Mongo.Collection.__getCollectionByName(collectionName);

      if (!collection) {
        Meteor.setTimeout(() => {
          populateCollection();
        }, 10);
        return;
      }
      for (const obj of result[collectionName]) {
        collection.set(obj._id, obj, true);
      }
      filled[collectionName] = true;
      if (Object.values(filled).filter(Boolean).length === 0) {
        Mongo.Collection.allCollections().forEach(collection =>
          collection.invalidate()
        );
      }
    };
    populateCollection();
  }
}
export const cacheKey = (methodName, args) => {
  import crypto from 'crypto';
  return crypto
    .createHash('sha1')
    .update(`${methodName}-${EJSON.stringify(args)}`)
    .digest('base64');
};
