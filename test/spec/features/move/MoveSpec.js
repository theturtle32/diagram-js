'use strict';

var Events = require('../../../util/Events');

/* global bootstrapDiagram, inject */


var modelingModule = require('../../../../lib/features/modeling'),
    moveModule = require('../../../../lib/features/move'),
    rulesModule = require('./rules');


describe('features/move - Move', function() {

  beforeEach(bootstrapDiagram({ modules: [ moveModule, rulesModule, modelingModule ] }));

  var Event;

  beforeEach(inject(function(canvas, dragging) {
    Event = Events.target(canvas._svg);

    dragging.setOptions({ manual: true });
  }));

  afterEach(inject(function(dragging) {
    dragging.setOptions({ manual: false });
  }));


  var rootShape, parentShape, childShape, childShape2, connection;

  beforeEach(inject(function(elementFactory, canvas) {

    rootShape = elementFactory.createRoot({
      id: 'root'
    });

    canvas.setRootElement(rootShape);

    parentShape = elementFactory.createShape({
      id: 'parent',
      x: 100, y: 100, width: 300, height: 300
    });

    canvas.addShape(parentShape, rootShape);

    childShape = elementFactory.createShape({
      id: 'child',
      x: 110, y: 110, width: 100, height: 100
    });

    canvas.addShape(childShape, parentShape);

    childShape2 = elementFactory.createShape({
      id: 'child2',
      x: 200, y: 110, width: 100, height: 100
    });

    canvas.addShape(childShape2, parentShape);

    connection = elementFactory.createConnection({
      id: 'connection',
      waypoints: [ { x: 150, y: 150 }, { x: 150, y: 200 }, { x: 350, y: 150 } ],
      source: childShape,
      target: childShape2
    });

    canvas.addConnection(connection, parentShape);
  }));


  describe('bootstrap', function() {

    it('should bootstrap diagram with component', inject(function() {}));

  });


  describe('style integration via <djs-dragging>', function() {

    it('should append class to shape + outgoing connections', inject(function(move, dragging, elementRegistry) {

      // given
      move.start(Event.create({ x: 10, y: 10 }), childShape);

      // when
      dragging.move(Event.create({ x: 20, y: 20 }));

      // then
      expect(elementRegistry.getGraphics(childShape).hasClass('djs-dragging')).to.equal(true);
      expect(elementRegistry.getGraphics(connection).hasClass('djs-dragging')).to.equal(true);
    }));


    it('should append class to shape + incoming connections', inject(function(move, dragging, elementRegistry) {

      // given
      move.start(Event.create({ x: 10, y: 10 }), childShape2);

      // when
      dragging.move(Event.create({ x: 20, y: 20 }));

      // then
      expect(elementRegistry.getGraphics(childShape2).hasClass('djs-dragging')).to.equal(true);
      expect(elementRegistry.getGraphics(connection).hasClass('djs-dragging')).to.equal(true);
    }));


    it('should remove class on drag end', inject(function(move, dragging, elementRegistry) {

      // given
      move.start(Event.create({ x: 10, y: 10 }), childShape2);

      // when
      dragging.move(Event.create({ x: 30, y: 30 }));
      dragging.end();

      // then
      expect(elementRegistry.getGraphics(childShape2).hasClass('djs-dragging')).to.equal(false);
      expect(elementRegistry.getGraphics(connection).hasClass('djs-dragging')).to.equal(false);
    }));

  });


  describe('drop markup', function() {

    it('should indicate drop allowed', inject(function(move, dragging, elementRegistry) {

      // given
      move.start(Event.create({ x: 10, y: 10 }), childShape);

      // when
      dragging.move(Event.create({ x: 20, y: 20 }));
      dragging.hover(Event.create({ x: 20, y: 20 }, {
        element: parentShape,
        gfx: elementRegistry.getGraphics(parentShape)
      }));

      dragging.move(Event.create({ x: 22, y: 22 }));

      // then
      var ctx = dragging.active();
      expect(ctx.data.context.canExecute).to.equal(true);

      expect(elementRegistry.getGraphics(parentShape).hasClass('drop-ok')).to.equal(true);
    }));


    it('should indicate drop not allowed', inject(function(move, dragging, elementRegistry) {

      // given
      move.start(Event.create({ x: 10, y: 10 }), childShape);

      // when
      dragging.move(Event.create({ x: 20, y: 20 }));
      dragging.hover(Event.create({ x: 20, y: 20 }, {
        element: childShape,
        gfx: elementRegistry.getGraphics(childShape)
      }));

      dragging.move(Event.create({ x: 22, y: 22 }));

      // then
      var ctx = dragging.active();
      expect(ctx.data.context.canExecute).to.equal(false);

      expect(elementRegistry.getGraphics(childShape).hasClass('drop-not-ok')).to.equal(true);
    }));

  });


  describe('modeling', function() {

    it('should round movement to pixels', inject(function(move, dragging, elementRegistry) {

      // given
      move.start(Event.create({ x: 0, y: 0 }), childShape);

      // when
      dragging.move(Event.create({ x: 20, y: 20 }));
      dragging.hover({
        element: parentShape,
        gfx: elementRegistry.getGraphics(parentShape)
      });

      dragging.move(Event.create({ x: 30.4, y: 99.7 }));

      dragging.end();

      // then
      expect(childShape.x).to.eql(140);
      expect(childShape.y).to.eql(210);
    }));

  });


  describe('attachment - moving', function () {

    var host, host2, attacher, attacher2;

    beforeEach(inject(function(canvas, modeling, elementFactory, elementRegistry) {
      host = elementFactory.createShape({
        id: 'host',
        x: 500, y: 100, width: 100, height: 100
      });

      canvas.addShape(host, rootShape);

      host2 = elementFactory.createShape({
        id: 'host2',
        x: 200, y: 250, width: 100, height: 100
      });

      canvas.addShape(host2, parentShape);

      attacher = elementFactory.createShape({
        id: 'attacher',
        x: 0, y: 0, width: 50, height: 50
      });

      modeling.createShape(attacher, { x: 600, y: 100 }, host, true);

      attacher2 = elementFactory.createShape({
        id: 'attacher2',
        x: 0, y: 0, width: 50, height: 50
      });

      modeling.createShape(attacher2, { x: 600, y: 200 }, host, true);
    }));


    it('should move attachers along with host', inject(function(move, dragging, elementRegistry) {

      // given
      var rootGfx = elementRegistry.getGraphics(rootShape);

      // when
      move.start(Event.create({ x: 550, y: 150 }), host);

      dragging.hover({
        element: rootShape,
        gfx: rootGfx
      });

      dragging.move(Event.create({ x: 700, y: 300 }));
      dragging.end();

      // then
      expect(attacher.x).to.equal(725);
      expect(attacher.y).to.equal(225);

      expect(attacher.host).to.eql(host);
      expect(host.attachers).to.include(attacher);

      expect(attacher2.x).to.equal(725);
      expect(attacher2.y).to.equal(325);

      expect(attacher2.host).to.equal(host);
      expect(host.attachers).to.include(attacher2);
    }));


    it('should move attachers along with NEW host', inject(function(move, dragging, elementRegistry) {

      // given
      var host2Gfx = elementRegistry.getGraphics(host2),
          parentGfx = elementRegistry.getGraphics(parentShape);

      // when
      move.start(Event.create({ x: 625, y: 125 }), attacher);

      dragging.hover({
        element: host2,
        gfx: host2Gfx
      });

      dragging.move(Event.create({ x: 225, y: 275 }));
      dragging.end();

      move.start(Event.create({ x: 250, y: 300 }), host2);

      dragging.hover({
        element: parentShape,
        gfx: parentGfx
      });

      dragging.move(Event.create({ x: 300, y: 300 }));
      dragging.end();

      // then
      expect(attacher.x).to.equal(225);
      expect(attacher.y).to.equal(225);

      expect(attacher.host).to.eql(host2);
      expect(host2.attachers).to.include(attacher);
    }));


    it('should move attachers along with host selection',
      inject(function(move, dragging, elementRegistry, selection) {

      // given
      var rootGfx = elementRegistry.getGraphics(rootShape);

      selection.select([ host, attacher, attacher2 ]);

      // when
      move.start(Event.create({ x: 550, y: 150 }), host);

      dragging.hover({
        element: rootShape,
        gfx: rootGfx
      });

      dragging.move(Event.create({ x: 700, y: 300 }));
      dragging.end();

      // then
      expect(attacher.x).to.equal(725);
      expect(attacher.y).to.equal(225);

      expect(attacher.host).to.eql(host);
      expect(host.attachers).to.include(attacher);

      expect(attacher2.x).to.equal(725);
      expect(attacher2.y).to.equal(325);

      expect(attacher2.host).to.equal(host);
      expect(host.attachers).to.include(attacher2);
    }));


    it('should move attachers along with parent',
      inject(function(move, dragging, elementRegistry, selection) {

      // given
      var rootGfx = elementRegistry.getGraphics(rootShape);
      var host2Gfx = elementRegistry.getGraphics(host2);

      // when
      move.start(Event.create({ x: 625, y: 125 }), attacher);

      dragging.hover({
        element: host2,
        gfx: host2Gfx
      });

      dragging.move(Event.create({ x: 225, y: 275 }));
      dragging.end();

      // when
      move.start(Event.create({ x: 550, y: 150 }), parentShape);

      dragging.hover({
        element: rootShape,
        gfx: rootGfx
      });

      dragging.move(Event.create({ x: 700, y: 300 }));
      dragging.end();

      // then
      expect(attacher.x).to.eql(325);
      expect(attacher.y).to.eql(375);

      expect(attacher.host).to.eql(host2);
      expect(host2.attachers).to.include(attacher);
    }));


    it('should not move disallowed attacher', inject(function(move, dragging, elementRegistry) {
      // given
      var hostGfx = elementRegistry.getGraphics(host);

      // when
      move.start(Event.create({ x: 600, y: 200 }), attacher2);

      dragging.hover({
        element: host,
        gfx: hostGfx
      });

      dragging.move(Event.create({ x: 100, y: 100 }));

      // then
      expect(attacher2.x).to.equal(575);
      expect(attacher2.y).to.equal(175);
    }));


    it('should detach attacher from host', inject(function(move, dragging, elementRegistry, eventBus) {

      // given
      var parentGfx = elementRegistry.getGraphics(parentShape);

      // when
      move.start(Event.create({ x: 625, y: 125 }), attacher);

      dragging.hover({
        element: parentShape,
        gfx: parentGfx
      });

      dragging.move(Event.create({ x: 425, y: 125 }));

      dragging.end();

      // then
      expect(attacher.host).to.not.exist;
      expect(attacher.parent).to.equal(parentShape);

      expect(parentShape.attachers).not.to.contain(attacher);

      expect(host.attachers).to.include(attacher2);
      expect(host.attachers).to.not.include(attacher);
    }));


    it('should reattach to host -> detachment (undo)',
      inject(function(move, dragging, elementRegistry, eventBus, commandStack) {
      // given
      var parentGfx = elementRegistry.getGraphics(parentShape);

      // when
      move.start(Event.create({ x: 625, y: 125 }), attacher);

      dragging.hover({
        element: parentShape,
        gfx: parentGfx
      });

      dragging.move(Event.create({ x: 425, y: 125 }));
      dragging.end();

      commandStack.undo();

      // then
      expect(attacher.host).to.equal(host);
      expect(attacher.parent).to.equal(rootShape);

      expect(host.attachers).to.include(attacher);
    }));


    it('should detach and reattach', inject(function(elementRegistry, move, dragging) {

      // given
      var parentGfx = elementRegistry.getGraphics(parentShape),
          hostGfx = elementRegistry.getGraphics(host);

      // when
      move.start(Event.create({ x: 625, y: 125 }), attacher);

      dragging.hover({
        element: parentShape,
        gfx: parentGfx
      });

      dragging.move(Event.create({ x: 425, y: 125 }));
      dragging.end();

      // then
      expect(attacher.host).not.to.exist;


      // but when ...
      move.start(Event.create({ x: 700, y: 275 }), attacher);

      dragging.hover({
        element: host,
        gfx: hostGfx
      });

      dragging.move(Event.create({ x: 625, y: 125 }));
      dragging.end();

      // then
      expect(attacher.host).to.exist;
      expect(attacher.parent).to.equal(rootShape);

      expect(host.attachers).to.include(attacher);
    }));


    it('should attach to another host', inject(function(elementRegistry, move, dragging) {
      // given
      var host2Gfx = elementRegistry.getGraphics(host2);

      // when
      move.start(Event.create({ x: 625, y: 125 }), attacher);

      dragging.hover({
        element: host2,
        gfx: host2Gfx
      });

      dragging.move(Event.create({ x: 225, y: 275 }));
      dragging.end();

      // then
      expect(attacher.host).to.equal(host2);
      expect(attacher.parent).to.equal(parentShape);
      expect(host2.attachers).to.include(attacher);
    }));


    it('should reattach to original host on undo', inject(function(elementRegistry, move, dragging, commandStack) {
      // given
      var host2Gfx = elementRegistry.getGraphics(host2);

      // when
      move.start(Event.create({ x: 625, y: 125 }), attacher);

      dragging.hover({
        element: host2,
        gfx: host2Gfx
      });

      dragging.move(Event.create({ x: 225, y: 275 }));
      dragging.end();

      commandStack.undo();

      // then
      expect(attacher.host).to.equal(host);

      expect(attacher.parent).to.equal(rootShape);

      expect(host.attachers).to.include(attacher);
      expect(host2.attachers).to.not.include(attacher);
    }));


    it('should attach to another host when moving with a label',
      inject(function(elementFactory, elementRegistry, modeling, move, dragging, selection) {
      // given
      var host2Gfx = elementRegistry.getGraphics(host2),
          label = elementFactory.createLabel({ width: 80, height: 40 });

      modeling.createLabel(attacher, { x: 600, y: 100 }, label, parentShape);

      selection.select([ attacher, label ]);

      // when
      move.start(Event.create({ x: 625, y: 125 }), attacher);

      dragging.hover({
        element: host2,
        gfx: host2Gfx
      });

      dragging.move(Event.create({ x: 225, y: 275 }));
      dragging.end();

      // then
      expect(attacher.host).to.equal(host2);
      expect(attacher.parent).to.equal(parentShape);
      expect(host2.attachers).to.include(attacher);
    }));

  });

  describe('attachment - visuals', function () {

    var host, host2, attacher, attacher2, label;

    beforeEach(inject(function(canvas, modeling, elementFactory, elementRegistry) {
      host = elementFactory.createShape({
        id: 'host',
        x: 500, y: 100, width: 100, height: 100
      });

      canvas.addShape(host, rootShape);

      attacher = elementFactory.createShape({
        id: 'attacher',
        x: 575, y: 75, width: 50, height: 50
      });

      canvas.addShape(attacher, rootShape);

      attacher2 = elementFactory.createShape({
        id: 'attacher2',
        x: 0, y: 0, width: 50, height: 50
      });

      modeling.createShape(attacher2, { x: 600, y: 200 }, host, true);

      label = elementFactory.createLabel({ width: 80, height: 40 });

      modeling.createLabel(attacher, { x: 600, y: 100 }, label, parentShape);

      host2 = elementFactory.createShape({
        id: 'host2',
        x: 500, y: 300, width: 100, height: 100
      });

      canvas.addShape(host2, rootShape);
    }));


    it('should be on top of host with label',
      inject(function(elementFactory, elementRegistry, modeling, move, dragging, selection) {
      // given
      var host2Gfx = elementRegistry.getGraphics(host2);

      selection.select([ attacher, label ]);

      // when
      move.start(Event.create({ x: 800, y: 100 }), attacher);

      dragging.hover({
        element: host2,
        gfx: host2Gfx
      });

      dragging.move(Event.create({ x: 800, y: 400 }));
      dragging.end();

      var rootChildren = rootShape.children;

      // then
      expect(rootChildren.indexOf(attacher)).to.be.above(rootChildren.indexOf(host2));

      expect(rootChildren.indexOf(label)).to.be.above(rootChildren.indexOf(host2));
      expect(rootChildren.indexOf(label)).to.be.above(rootChildren.indexOf(attacher));
    }));


    it('should add attachment marker', inject(function(move, dragging, elementRegistry) {
      // given
      var hostGfx = elementRegistry.getGraphics(host);

      // when
      move.start(Event.create({ x: 800, y: 100 }), attacher);

      dragging.hover({
        element: host,
        gfx: hostGfx
      });

      dragging.move(Event.create({ x: 575, y: 75 }));

      var ctx = dragging.active();

      // then
      expect(ctx.data.context.canExecute).to.equal('attach');
      expect(elementRegistry.getGraphics(host).hasClass('attach-ok')).to.be.true;
    }));


    it('should remove attachment marker', inject(function(move, dragging, elementRegistry) {
      // given
      var hostGfx = elementRegistry.getGraphics(host);

      // when
      move.start(Event.create({ x: 800, y: 100 }), attacher);

      dragging.hover({
        element: host,
        gfx: hostGfx
      });

      dragging.move(Event.create({ x: 575, y: 75 }));
      dragging.end();

      // then
      expect(elementRegistry.getGraphics(host).hasClass('attach-ok')).to.be.false;
    }));

  });

});
