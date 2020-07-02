import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';
import throttle from 'lodash.throttle';
import keys from 'lodash.keys';

export const CHANGES_NAMESPACE = 'CHANGES_NAMESPACE';
export const CHANGES_METHOD_NAME = 'CHANGES_METHOD_NAME';
export function reduceToMethodSubscriptionFormat(arrayOfCursors) {
  return arrayOfCursors.reduce((returnValue, cursor) => {
    const args = cursor._cursorDescription.selector;
    let result;
    const keyName = cacheKey(CHANGES_NAMESPACE, args);
    const cachedResponse = getFromRedis(keyName);
    if (cachedResponse) {
      result = EJSON.parse(cachedResponse);
    } else {
      result = cursor.fetch().map(doc => ({ ...doc, disallowReset: true }));
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

export function getFromRedis() {
  import { getRedisPusher } from 'meteor/cultofcoders:redis-oplog';
  const redisClient = getRedisPusher();

  return Meteor.wrapAsync(redisClient.get.bind(redisClient))(...arguments);
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
  for (const collectionName of Object.keys(result)) {
    const populateCollection = () => {
      const collection = Mongo.Collection.__getCollectionByName(collectionName);

      if (!collection) {
        Meteor.setTimeout(() => {
          populateCollection();
        }, 10);
        return;
      }
      for (const obj of result[collectionName]) {
        collection.set(obj._id, obj);
      }
    };
    populateCollection();
  }
}
export const cacheKey = (methodName, args) => {
  return `${methodName}-${EJSON.stringify(args)}`;
};
