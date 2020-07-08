# Meteor fast methods

Cached methods and initial data population for free with redis-oplog. WIP, please don't use it yet.


## Usage
### Preload data
For loading data directly on minimongo for each page serve, use the following on the server:
```
preloadData(sink => {
  const { community } = getContext(sink, true) || {};
  return [Images.find({ communityId: community._id })];
});
```
sink is the meteor server-render package object.

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