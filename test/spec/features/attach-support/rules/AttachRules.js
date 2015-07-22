'use strict';

var inherits = require('inherits');

var RuleProvider = require('../../../../../lib/features/rules/RuleProvider');

function MoveRules(eventBus) {
  RuleProvider.call(this, eventBus);
}

MoveRules.$inject = [ 'eventBus' ];

inherits(MoveRules, RuleProvider);

module.exports = MoveRules;


MoveRules.prototype.init = function() {

  this.addRule('shapes.move', function(context) {
    var shapes = context.shapes,
        target = context.target;


    if (shapes.length === 1 && shapes[0].id === 'attacher' && target) {

      if (target.id === 'host' || target.id === 'host2') {
        return 'attach';
      } else if (target.id === 'parent') {
        return true;
      } else {
        return false;
      }
    }

    if (shapes.length === 1 && shapes[0].id === 'attacher2') {
      return false;
    }
  });
};
