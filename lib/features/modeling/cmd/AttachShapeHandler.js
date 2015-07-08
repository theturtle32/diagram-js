'use strict';

/**
 * A handler that implements reversible attaching/detaching of shapes.
 */
function AttachShapeHandler(modeling) {
  this._modeling = modeling;
}

module.exports = AttachShapeHandler;

AttachShapeHandler.$inject = [ 'modeling' ];


AttachShapeHandler.prototype.execute = function(context) {
  var shape = context.shape,
      newHost = context.newHost,
      oldHost = shape.host;

  // (0) detach from old host
  context.oldHost = oldHost;
  context.oldHostIdx = removeAttacher(oldHost, shape);

  // (1) attach to new host
  addAttacher(newHost, shape);

  // (2) update host
  shape.host = newHost;

  return shape;
};

AttachShapeHandler.prototype.revert = function(context) {
  var shape = context.shape,
      newHost = context.newHost,
      oldHost = context.oldHost,
      oldHostIdx = context.oldHostIdx;

  // (2) update host
  shape.host = oldHost;

  // (1) attach to new host
  removeAttacher(newHost, shape);

  // (0) detach from old host
  addAttacher(oldHost, shape, oldHostIdx);

  return shape;
};


function removeAttacher(host, attacher) {
  var attachers = host && host.attachers;

  var idx = -1;

  if (attachers) {
    idx = attachers.indexOf(attacher);

    if (idx !== -1) {
      attachers.splice(idx, 1);
    }
  }

  return idx;
}

function addAttacher(host, attacher, idx) {

  if (!host) {
    return;
  }

  var attachers = host.attachers;

  if (!attachers) {
    host.attachers = attachers = [];
  }

  attachers.splice(idx || attachers.length, 0, attacher);
}