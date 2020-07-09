import Fibers from 'fibers';

import { _ } from 'meteor/underscore';
export const Context = function Context(loginToken, otherParams) {
  _.extend(this, otherParams);

  // get the user
  if (Meteor.users) {
    // check to make sure, we've the loginToken,
    // otherwise a random user will fetched from the db
    if (loginToken) {
      var hashedToken = loginToken && Accounts._hashLoginToken(loginToken);
      var query = { 'services.resume.loginTokens.hashedToken': hashedToken };
      var options = { fields: { _id: 1 } };
      var user = Meteor.users.findOne(query, options);
    }

    // support for Meteor.user
    Fibers.current._meteor_dynamics = [];
    Fibers.current._meteor_dynamics[DDP._CurrentInvocation.slot] = this;

    if (user) {
      this.userId = user._id;
    }
  }
};
