Package.describe({
  name: 'pathable:meteor-fast-methods',
  version: '0.2.4',
  summary: 'Faster methods with redis and redis-oplog',
});

Package.onUse(function (api) {
  api.versionsFrom('1.10.2');
  api.use('cultofcoders:redis-oplog@2.0.5');
  api.use('mongo');
  api.use('tracker');
  api.use('underscore');
  api.use('ecmascript');
  api.use('server-render');
  api.use('mdg:validated-method@1.2.0');

  api.mainModule('server.js', 'server');
  api.mainModule('client.js', 'client');
  api.export('preloadData');
  api.export('CachedValidatedMethod');
  api.export('FastMethods');
});
Npm.depends({
  'lodash.keys': '4.2.0',
  'redis': '3.0.2',
  'lodash.isstring': '4.0.1',
  'lodash.throttle': '4.1.1',
  'fibers': '5.0.0',
  'js-cookie': '2.2.1',
});
