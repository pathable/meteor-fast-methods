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