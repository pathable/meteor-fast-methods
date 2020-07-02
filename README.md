# Meteor fast methods

Cached methods and initial data population for free with redis-oplog.


## Usage
### Preload data
For loading data directly on minimongo for each page serve, use the following:
```
preloadData(sink => {
  const { community } = getContext(sink, true) || {};
  return [Images.find({ communityId: community._id })];
});
```
sink is the meteor server-render package object.

### Cached Methods
Define new methods with CachedValidatedMethod exported from this package. They will be automatically cached on redis.
```javascript
export default new CachedValidatedMethod({
  name: 'dataImport/importJobs#update',
  mixins: [updatable(ImportJobs), scopedMethod],
  validate: updateSchema.validator(),
});
```

##Configuration
//TODO: Cache expiration time