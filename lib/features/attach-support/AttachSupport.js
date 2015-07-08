'use strict';

var forEach = require('lodash/collection/forEach'),
    flatten = require('lodash/array/flatten'),
    filter = require('lodash/collection/filter'),
    map = require('lodash/collection/map');

var inherits = require('inherits');

var LOW_PRIORITY = 250;

var CommandInterceptor = require('../../command/CommandInterceptor');

function AttachSupport(eventBus, modeling, moveVisuals) {

  CommandInterceptor.call(this, eventBus);

  function getAttachers(shapes) {
    return flatten(map(shapes, function(s) {
      return s.attachers || [];
    }));
  }

  // add attachers to the visual's group
  eventBus.on('shape.move.start', LOW_PRIORITY, function(e) {

    var context = e.context,
        shapes = context.shapes;

    var attachers = getAttachers(shapes);

    forEach(attachers, function(attacher) {
      moveVisuals.addDragger(context, attacher);
    });

  });

  // add attachers to move operation
  this.preExecute([ 'shapes.move' ], function(e) {
    var context = e.context,
        shapes = context.shapes;

    var attachers = getAttachers(shapes);

    forEach(attachers, function(attacher) {
      context.shapes.push(attacher);
    });

  });

  // perform the attaching after shapes are done moving
  this.postExecute([ 'shapes.move' ], function(e) {
    var context = e.context,
        shapes = context.shapes,
        newHost = context.newHost,
        attachers;

    if (shapes.length > 1) {
      return;
    }

    if (newHost) {

      attachers = shapes;
    } else {

      attachers = filter(shapes, function(s) {
        if (s.host) {
          return true;
        }
        return false;
      });
    }

    forEach(attachers, function(attacher) {

      var parent = attacher.parent,
          children = parent.children,
          host = newHost || attacher.host,
          label,
          hostIdx,
          attacherIdx,
          labelIdx;

      modeling.attachShape(attacher, newHost);

      // make sure attachers are on top of host
      if ((hostIdx = children.indexOf(host)) > (attacherIdx = children.indexOf(attacher))) {

        // remove attacher from it's parent's children array
        children.splice(attacherIdx, 1);

        // add attacher on top of host
        children.splice(hostIdx + 1, 0, attacher);

        // make sure label is on top of attacher
        if ((label = attacher.label)) {
          labelIdx = children.indexOf(label);

          children.splice(labelIdx, 1);

          attacherIdx = children.indexOf(attacher);

          children.splice(attacherIdx + 1, 0, label);
        }
      }

    });

  });
}

inherits(AttachSupport, CommandInterceptor);

AttachSupport.$inject = [ 'eventBus', 'modeling', 'moveVisuals' ];

module.exports = AttachSupport;
