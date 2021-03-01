# Meteor fast methods

Distributed cached methods and initial data population for free with redis-oplog. Fast-render revamped.


## Usage
### Preload data
For loading data directly on minimongo for each page serve, use the following on the server:

```
preloadData(sink => {
  const { community } = getContext(sink, true) || {};
  return [Images.find({ communityId: community._id })];
});
```

Sink is the meteor server-render package object. this.userId and Meteor.user() are available in this context, instead of pure sink methods.

pro-tip: You can control the data based on routes by getting sink.request.url.pathname

### Reactive initial data

If the data you have preloaded above has the requirement to be reactive, there is the following method:
```js
FastMethods.startListeningToChanges({ namespace: communityId });
```
that will use redis-vent to propagate changes to the client, so you will have preloaded reactive content.
The namespace param is in case you want to scope changes to a namespace and avoid invalidating all cursors at the same time. This is important if your system is big and you want more scalability.
Make sure your APP has redis-oplog correctly configured.

### Client Usage

You don't have do to anything in the client-side. All the data you have published inside preloadData() will be available at the client, including scoped logged user data. You just have to make sure we have finished loading everything to minimongo before using it.
This library does provide the following reactive method dependency for checking it:

```js
FastMethods.ready()
```

If this returns true, you can do finds on minimongo.


### Cached Methods
Define new methods with CachedValidatedMethod exported from this package, and set enableCache: true. They will be automatically cached on redis.
```javascript
export default new CachedValidatedMethod({
  name: 'dataImport/importJobs#update',
  mixins: [updatable(ImportJobs), scopedMethod],
  validate: updateSchema.validator(),
  enableCache: true,
});
```

## Configuration
//TODO: Cache expiration time
