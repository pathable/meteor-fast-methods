const map = {};

const constructor = Mongo.Collection;
const proto = Mongo.Collection.prototype;

const hook = function () {
  var ret = constructor.apply(this, arguments);
  map[arguments[0]] = this;
  this._name = arguments[0];
  return ret;
};

hook.__getCollectionByName = function (name) {
  return map[name];
};
hook.allCollections = function () {
  return Object.values(map);
};

hook.prototype = proto;
hook.prototype.constructor = hook;

for (var prop in constructor) {
  if (constructor.hasOwnProperty(prop)) {
    hook[prop] = constructor[prop];
  }
}

Mongo.Collection = hook;
Meteor.Collection = Mongo.Collection;
