var _ = require("lodash"),
    expect = require("./chai").expect;

exports.tests = function(GraphConstructor) {
  if (!GraphConstructor) {
    throw new Error("A GraphConstructor is required to run the base graph tests.");
  }

  describe("BaseGraph", function() {
    var g;

    beforeEach(function() {
      g = new GraphConstructor();
    });

    describe("initial graph state", function() {
      it("has no nodes", function() {
        expectEmptyGraph(g);
      });

      it("has no label", function() {
        expect(g.getGraph()).to.be.undefined;
      });
    });

    describe("setGraph", function() {
      it("sets the label for the graph", function() {
        g.setGraph("foo");
        expect(g.getGraph()).to.equal("foo");
      });

      it("clears the label for the graph if no value is given", function() {
        g.setGraph("foo");
        g.setGraph();
        expect(g.getGraph()).to.be.undefined;
      });
    });

    describe("updateGraph", function() {
      it("updates the label for the graph", function() {
        g.setGraph("foo");
        g.updateGraph(function(old) { return old + "-bar"; });
        expect(g.getGraph()).to.equal("foo-bar");
      });

      it("clears the label for the graph if no value is given", function() {
        g.setGraph("foo");
        g.updateGraph(function() {});
        expect(g.getGraph()).to.be.undefined;
      });
    });

    describe("hasNode", function() {
      it("returns false if the node is not in the graph", function() {
        expect(g.hasNode("node-not-in-graph")).to.be.false;
      });
    });

    describe("getNode", function() {
      it("returns undefined if the node is not in the graph", function() {
        expect(g.getNode("node-not-in-graph")).to.be.undefined;
      });
    });

    describe("setNode", function() {
      it("creates the node if it isn't part of the graph", function() {
        g.setNode("key", "label");
        expectSingleNodeGraph(g, "key", "label");
      });

      it("replaces the node's value if it is part of the graph", function() {
        g.setNode("key", "old");
        g.setNode("key", "new");
        expectSingleNodeGraph(g, "key", "new");
      });

      it("coerces the node's id to a string", function() {
        g.setNode(1);
        expect(g.nodes()).to.eql([{ v: "1", label: undefined }]);
        expect(g.nodeIds()).to.eql(["1"]);
      });

      it("preserves the label's type", function() {
        g.setNode("bool", false);
        g.setNode("number", 1234);
        g.setNode("object", { foo: "bar" });

        expect(g.getNode("bool")).to.be.false;
        expect(g.getNode("number")).to.equal(1234);
        expect(g.getNode("object")).to.eql({ foo: "bar" });
      });

      it("defaults the label to undefined", function() {
        g.setNode("key");
        expect(g.getNode("key")).to.be.undefined;
      });

      it("doesn't change the node's label if the label was not specified", function() {
        g.setNode("key", "label");
        g.setNode("key");
        expect(g.getNode("key")).to.equal("label");
      });

      it("is chainable", function() {
        var g2 = g.setNode("key", "label");
        expect(g).to.equal(g2);
      });
    });

    describe("setNodes", function() {
      it("creates the nodes if they are not part of the graph", function() {
        g.setNodes(["a", "b", "c"], "label");
        expect(g.getNode("a")).to.equal("label");
        expect(g.getNode("b")).to.equal("label");
        expect(g.getNode("c")).to.equal("label");
        expect(g.nodeCount()).to.equal(3);
      });

      it("replaces nodes values if the node is in the graph", function() {
        g.setNode("b", "old-label");
        g.setNodes(["a", "b", "c"], "new-label");
        expect(g.getNode("a")).to.equal("new-label");
        expect(g.getNode("b")).to.equal("new-label");
        expect(g.getNode("c")).to.equal("new-label");
      });

      it("does not replace node labels if the label is not specified", function() {
        g.setNode("b", "label");
        g.setNodes(["a", "b", "c"]);
        expect(g.getNode("a")).to.be.undefined;
        expect(g.getNode("b")).to.equal("label");
        expect(g.getNode("c")).to.be.undefined;
      });

      it("is chainable", function() {
        var g2 = g.setNode("key", "label");
        expect(g).to.equal(g2);
      });
    });

    describe("updateNode", function() {
      var updater = function(prev) { return prev + "-new"; };

      it("creates the node if it isn't part of the graph", function() {
        g.updateNode("key", updater);
        expectSingleNodeGraph(g, "key", undefined + "-new");
      });

      it("replaces the node's label if the node is part of the graph", function() {
        g.setNode("key", "label");
        g.updateNode("key", updater);
        expectSingleNodeGraph(g, "key", "label-new");
      });

      it("passes in the node's id", function() {
        g.setNode("key", "label");
        g.updateNode("key", function(prev, v) { return v + "-" + prev; });
        expectSingleNodeGraph(g, "key", "key-label");
      });

      it("is chainable", function() {
        var g2 = g.updateNode("key", updater);
        expect(g).to.equal(g2);
      });
    });

    describe("updateNodes", function() {
      it("updates all of the specified nodes", function() {
        g.setNode("a", "label");
        g.updateNodes(["a", "b"], function(prev, v) { return v + "-" + prev; });
        expect(g.getNode("a")).to.equal("a-label");
        expect(g.getNode("b")).to.equal("b-undefined");
      });

      it("is chainable", function() {
        var g2 = g.updateNodes(["key"], function() {});
        expect(g).to.equal(g2);
      });
    });

    describe("setDefaultNodeLabel", function() {
      it("assigns the default value for created nodes", function() {
        g.setDefaultNodeLabel(1);
        g.setNode("a");
        g.setNode("b");
        expect(g.getNode("a")).to.equal(1);
        expect(g.getNode("b")).to.equal(1);
      });

      it("can use a function to create the default value", function() {
        g.setDefaultNodeLabel(function(v) { return v + "-label"; });
        g.setNode("a");
        g.setNode("b");
        expect(g.getNode("a")).to.equal("a-label");
        expect(g.getNode("b")).to.equal("b-label");
      });
    });

    describe("removeNode", function() {
      it("does nothing if the node is not part of the graph", function() {
        var removed;
        g._onRemoveNode = function(v) { removed = v; };
        g.removeNode("key");
        expectEmptyGraph(g);
        expect(removed).to.be.undefined;
      });

      it("removes the node if it is part of the graph", function() {
        var removed;
        g._onRemoveNode = function(v) { removed = v; };
        g.setNode("key", "label");
        g.removeNode("key");
        expectEmptyGraph(g);
        expect(removed).to.equal("key");
      });

      it("removes all incident in-edges", function() {
        g.setEdge("n1", "n2");
        g.removeNode("n2");
        expect(g.hasEdge("n1", "n2")).to.be.false;
        expect(g.edgeCount()).to.equal(0);
        expectSingleNodeGraph(g, "n1", undefined);
      });

      it("removes all incident out-edges", function() {
        g.setEdge("n1", "n2");
        g.removeNode("n1");
        expect(g.hasEdge("n1", "n2")).to.be.false;
        expect(g.edgeCount()).to.equal(0);
        expectSingleNodeGraph(g, "n2", undefined);
      });

      it("decrements edge count once when deleting a self-loop", function() {
        g.setEdge("n1", "n1");
        g.removeNode("n1");
        expect(g.edgeCount()).to.equal(0);
      });

      it("is chainable", function() {
        var g2 = g.removeNode("key");
        expect(g).to.equal(g2);
      });
    });

    describe("successors", function() {
      it("returns undefined if the node is not in the graph", function() {
        expect(g.successors("node-not-in-graph")).to.be.undefined;
      });
    });

    describe("predecessors", function() {
      it("returns undefined if the node is not in the graph", function() {
        expect(g.predecessors("node-not-in-graph")).to.be.undefined;
      });
    });

    describe("neighbors", function() {
      it("returns the neighbors of a node", function() {
        g.setEdge("n1", "n1");
        g.setEdge("n1", "n2");
        g.setEdge("n2", "n3");
        g.setEdge("n3", "n1");
        expect(_.sortBy(g.neighbors("n1"))).to.eql(["n1", "n2", "n3"]);
      });

      it("returns undefined if the node is not in the graph", function() {
        expect(g.neighbors("node-not-in-graph")).to.be.undefined;
      });
    });

    describe("inEdges", function() {
      it("returns undefined if the node is not in the graph", function() {
        expect(g.inEdges("node-not-in-graph")).to.be.undefined;
      });

      it("does not allow changes through the returned edge object", function() {
        g.setEdge("n1", "n2", "label");
        var edge = g.inEdges("n2")[0];
        edge.label = "foo";
        expect(g.getEdge("n1", "n2")).to.equal("label");
      });
    });

    describe("outEdges", function() {
      it("returns undefined if the node is not in the graph", function() {
        expect(g.outEdges("node-not-in-graph")).to.be.undefined;
      });

      it("does not allow changes through the returned edge object", function() {
        g.setEdge("n1", "n2", "label");
        var edge = g.outEdges("n1")[0];
        edge.label = "foo";
        expect(g.getEdge("n1", "n2")).to.equal("label");
      });
    });

    describe("nodeEdges", function() {
      it("returns the edges incident on a node", function() {
        g.setEdge("n1", "n1", "l1");
        g.setEdge("n1", "n2", "l2");
        g.setEdge("n2", "n3", "l3");
        g.setEdge("n3", "n1", "l4");

        var result = _.sortBy(g.nodeEdges("n1"), ["v", "w"]);
        expect(result).to.eql([{ v: "n1", w: "n1", label: "l1" },
                               { v: "n1", w: "n2", label: "l2" },
                               { v: "n3", w: "n1", label: "l4" }]);
      });

      it("returns undefined if the node is not in the graph", function() {
        expect(g.nodeEdges("node-not-in-graph")).to.be.undefined;
      });

      it("does not allow changes through the returned edge object", function() {
        g.setEdge("n1", "n2", "label");
        var edge = g.nodeEdges("n1")[0];
        edge.label = "foo";
        expect(g.getEdge("n1", "n2")).to.equal("label");
      });
    });

    describe("setEdge", function() {
      it("creates the edge if it does not exist", function() {
        g.setNode("n1");
        g.setNode("n2");
        g.setEdge("n1", "n2", "label");
        expectSingleEdgeGraph(g, "n1", "n2", "label");
      });

      it("creates the incident nodes if they don't exist", function() {
        g.setEdge("n1", "n2", "label");
        expect(g.hasNode("n1")).to.be.true;
        expect(g.hasNode("n2")).to.be.true;
        expectSingleEdgeGraph(g, "n1", "n2", "label");
      });

      it("replaces the edge's label if the edge is part of the graph", function() {
        g.setEdge("n1", "n2", "old");
        g.setEdge("n1", "n2", "new");
        expectSingleEdgeGraph(g, "n1", "n2", "new");
      });

      it("does not replace an edge label if the label is not specified", function() {
        g.setEdge("n1", "n2", "label");
        g.setEdge("n1", "n2");
        expectSingleEdgeGraph(g, "n1", "n2", "label");
      });

      it("can remove a label by explicitly setting it to undefined", function() {
        g.setEdge("n1", "n2", "label");
        g.setEdge("n1", "n2", undefined);
        expect(g.hasEdge("n1", "n2")).to.be.true;
        expect(g.getEdge("n1", "n2")).to.be.undefined;
      });

      it("coerces the edge's node ids to strings", function() {
        g.setEdge(1, 2);
        expect(g.edges()).to.eql([{ v: "1", w: "2" }]);
      });

      it("preserves the label's type", function() {
        g.setEdge("a", "bool", false);
        g.setEdge("a", "number", 1234);
        g.setEdge("an", "object", { foo: "bar" });

        expect(g.getEdge("a", "bool")).to.be.false;
        expect(g.getEdge("a", "number")).to.equal(1234);
        expect(g.getEdge("an", "object")).to.eql({ foo: "bar" });
      });

      it("is chainable", function() {
        var g2 = g.setEdge("n1", "n2");
        expect(g).to.equal(g2);
      });
    });

    describe("setPath", function() {
      it("creates nodes as needed", function() {
        g.setPath(["a", "b", "c"]);
        expect(g.hasNode("a")).to.be.true;
        expect(g.hasNode("b")).to.be.true;
        expect(g.hasNode("c")).to.be.true;
        expect(g.nodeCount()).to.equal(3);
      });

      it("creates open paths", function() {
        g.setPath(["a", "b", "c"], "label");
        expect(g.hasEdge("a", "b")).to.be.true;
        expect(g.hasEdge("b", "c")).to.be.true;
        expect(g.hasEdge("c", "a")).to.be.false;
      });

      it("sets the labels for the edges in the path", function() {
        g.setPath(["a", "b", "c"], "label");
        expect(g.getEdge("a", "b")).to.equal("label");
        expect(g.getEdge("b", "c")).to.equal("label");
      });

      it("replaces labels for existing edges in the path", function() {
        g.setEdge("a", "b", "label");
        g.setPath(["a", "b", "c"], "new-label");
        expect(g.getEdge("a", "b")).to.equal("new-label");
        expect(g.getEdge("b", "c")).to.equal("new-label");
      });

      it("does not set labels if the label is not specified", function() {
        g.setEdge("a", "b", "label");
        g.setPath(["a", "b", "c"]);
        expect(g.getEdge("a", "b")).to.equal("label");
        expect(g.getEdge("b", "c")).to.be.undefined;
      });

      it("is chainable", function() {
        var g2 = g.setPath(["a", "b", "c"]);
        expect(g).to.equal(g2);
      });
    });

    describe("updateEdge", function() {
      var updater = function(label) { return label + "-new"; };

      it("adds and updates the edge if it does not exist", function() {
        g.updateEdge("n1", "n2", updater);
        expectSingleEdgeGraph(g, "n1", "n2", undefined + "-new");
      });

      it("updates the edge's label if it is in the graph", function() {
        g.setEdge("n1", "n2", "label");
        g.updateEdge("n1", "n2", updater);
        expectSingleEdgeGraph(g, "n1", "n2", "label-new");
      });

      it("is chainable", function() {
        var g2 = g.updateEdge("n1", "n2", updater);
        expect(g).to.equal(g2);
      });
    });

    describe("updatePath", function() {
      it("updates all edges on the path", function() {
        g.setEdge("a", "b", "label");
        g.updatePath(["a", "b", "c"], function(prev, edge) {
          return edge.v + "->" + edge.w + ":" + prev;
        });
        expect(g.getEdge("a", "b")).to.equal("a->b:label");
        expect(g.getEdge("b", "c")).to.equal("b->c:undefined");
      });

      it("is chainable", function() {
        var g2 = g.updatePath(["a", "b"], function() {});
        expect(g).to.equal(g2);
      });
    });

    describe("setDefaultEdgeLabel", function() {
      it("assigns the default value for created edges", function() {
        g.setDefaultEdgeLabel(1);
        g.setEdge("a", "b");
        expect(g.getEdge("a", "b")).to.equal(1);
      });

      it("can use a function to create the default value", function() {
        g.setDefaultEdgeLabel(function(edge) {
          return edge.v + "->" + edge.w;
        });
        g.setEdge("a", "b");
        expect(g.getEdge("a", "b")).to.equal("a->b");
      });
    });
    describe("removeEdge", function() {
      it("does nothing if the edge is not in the graph", function() {
        g.setNode("n1");
        g.setNode("n2");
        g.removeEdge("n1", "n2");
        expect(g.edgeCount()).to.equal(0);
        expect(g.nodeCount()).to.equal(2);

        g.removeEdge("n2", "n3");
        expect(g.edgeCount()).to.equal(0);
        expect(g.nodeCount()).to.equal(2);

        g.removeEdge("n3", "n1");
        expect(g.edgeCount()).to.equal(0);
        expect(g.nodeCount()).to.equal(2);
      });

      it("removes the edge if it is in the graph", function() {
        g.setEdge("n1", "n2");
        g.removeEdge("n1", "n2");
        expect(g.hasEdge("n1", "n2")).to.be.false;
        expect(g.edgeCount()).to.equal(0);
      });

      it("doesn't remove other edges incident on the nodes", function() {
        g.setEdge("n1", "n2");
        g.setEdge("n2", "n3");
        g.setEdge("n3", "n1");
        g.removeEdge("n1", "n2");
        expect(g.hasEdge("n1", "n2")).to.be.false;
        expect(g.edgeCount()).to.equal(2);
      });

      it("is chainable", function() {
        var g2 = g.removeEdge("n1", "n2");
        expect(g).to.equal(g2);
      });
    });

    describe("copy", function() {
      it("creates a shallow copy of the input graph", function() {
        g.setGraph("foo");
        g.setNode("n1", "label");

        var copy = g.copy();
        expect(copy.constructor).to.equal(g.constructor);
        expect(copy.getGraph()).to.equal(g.getGraph());
        expectSingleNodeGraph(g, "n1", "label");

        copy.setNode("n1", "new-label");
        expect(g.getNode("n1")).to.equal("label");
      });
    });

    describe("filterNodes", function() {
      it("copies all nodes if the predicate is always true", function() {
        g.setGraph("foo");
        g.setNode("n1", "lab1");
        g.setNode("n2", "lab2");
        g.setEdge("n1", "n2", "n1-n2");

        var copy = g.filterNodes(function() { return true; });
        expect(copy.constructor).to.equal(g.constructor);
        expect(copy.getGraph()).to.equal(g.getGraph());
        expect(copy.getNode("n1")).to.equal("lab1");
        expect(copy.getNode("n2")).to.equal("lab2");
        expect(copy.getEdge("n1", "n2")).to.equal("n1-n2");
        expect(copy.nodeCount()).to.equal(2);
        expect(copy.edgeCount()).to.equal(1);
      });

      it("removes nodes and incident edges for filtered-out nodes", function() {
        g.setNode("n1", "lab1");
        g.setNode("n2", "lab2");
        g.setEdge("n1", "n2", "n1-n2");

        var copy = g.filterNodes(function(u) { return u !== "n2"; });
        expectSingleNodeGraph(copy, "n1", "lab1");
        expect(copy.edgeCount()).to.equal(0);
      });

      it("allows filtering by label", function() {
        g.setNode("n1", "lab1");
        g.setNode("n2", "lab2");

        var copy = g.filterNodes(function(_, label) { return label !== "lab2"; });
        expectSingleNodeGraph(copy, "n1", "lab1");
      });

      it("preserves incident edges for preserved nodes", function() {
        g.setNode("n1", "lab1");
        g.setNode("n2", "lab2");
        g.setNode("n3", "lab3");
        g.setEdge("n1", "n2", "n1-n2");
        g.setEdge("n2", "n3", "n2-n3");

        var copy = g.filterNodes(function(v) { return v !== "n3"; });
        expect(copy.edges()).to.have.length(1);
        expect(copy.edges()[0]).to.eql({ v: "n1", w: "n2", label: "n1-n2" });
      });

      it("does not allow changes to the original graph", function() {
        g.setGraph("foo");
        g.setNode("n1", "lab1");

        var copy = g.filterNodes(function() { return true; });
        copy.setNode("n1", "new-lab");
        expect(g.getNode("n1")).to.equal("lab1");
        copy.setGraph("bar");
        expect(g.getGraph()).to.equal("foo");
      });
    });
  });
};

function expectEmptyGraph(g) {
  expect(g.nodeIds()).to.be.empty;
  expect(g.nodeCount()).to.equal(0);
  expect(g.edges()).to.be.empty;
  expect(g.edgeCount()).to.equal(0);
}
exports.expectEmptyGraph = expectEmptyGraph;

function expectSingleNodeGraph(g, key, label) {
  expect(g.getNode(key)).to.equal(label);
  expect(g.hasNode(key)).to.be.true;
  expect(g.nodes()).to.eql([{ v: key, label: label }]);
  expect(g.nodeIds()).to.eql([key]);
  expect(g.nodeCount()).to.equal(1);
}
exports.expectSingleNodeGraph = expectSingleNodeGraph;

function expectSingleEdgeGraph(g, v, w, label) {
  expect(g.edges().length).to.equal(1);
  expect(g.edges()[0]).to.eql({ v: v, w: w, label: label });
  expect(g.getEdge(v, w)).to.equal(label);
  expect(g.hasEdge(v, w)).to.be.true;
  expect(g.edgeCount()).to.equal(1);
}
exports.expectSingleEdgeGraph = expectSingleEdgeGraph;
