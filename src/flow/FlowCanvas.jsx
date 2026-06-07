import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow
} from "reactflow";
import "reactflow/dist/style.css";

import CustomNode from "./CustomNode";

const nodeTypes = {
  custom: CustomNode
};

const PAGE_WIDTH = 330;
const PAGE_GAP_X = 420;
const PAGE_GAP_Y = 330;
const MIN_NODE_GAP = 16;
const NEAR_NODE_DISTANCE = 34;
const START_END_WIDTH = 132;
const START_END_HEIGHT = 68;
const EMPTY_WIDTH = 360;
const EMPTY_HEIGHT = 142;

function getFieldElements(elements = []) {
  return elements.filter(
    element => element.type !== "section" && element.type !== "condition"
  );
}

function getPagePosition(index) {
  return {
    x: 220 + (index % 3) * PAGE_GAP_X,
    y: 90 + Math.floor(index / 3) * PAGE_GAP_Y
  };
}

function getFallbackSize(node) {
  if (node.data?.nodeKind === "flowStart" || node.data?.nodeKind === "flowEnd") {
    return { width: START_END_WIDTH, height: START_END_HEIGHT };
  }

  if (node.data?.nodeKind === "flowEmpty") {
    return { width: EMPTY_WIDTH, height: EMPTY_HEIGHT };
  }

  const fieldCount = Math.max(node.data?.fields?.length || 0, 1);

  return {
    width: Number(node.style?.width) || PAGE_WIDTH,
    height: 112 + fieldCount * 58
  };
}

function getNodeRect(node, position = node.position) {
  const fallbackSize = getFallbackSize(node);
  const width = node.width || Number(node.style?.width) || fallbackSize.width;
  const height = node.height || Number(node.style?.height) || fallbackSize.height;

  return {
    left: position.x,
    top: position.y,
    right: position.x + width,
    bottom: position.y + height,
    width,
    height
  };
}

function doRectsOverlap(firstRect, secondRect) {
  return !(
    firstRect.right <= secondRect.left ||
    firstRect.left >= secondRect.right ||
    firstRect.bottom <= secondRect.top ||
    firstRect.top >= secondRect.bottom
  );
}

function getRectDistance(firstRect, secondRect) {
  const horizontalDistance = Math.max(
    secondRect.left - firstRect.right,
    firstRect.left - secondRect.right,
    0
  );
  const verticalDistance = Math.max(
    secondRect.top - firstRect.bottom,
    firstRect.top - secondRect.bottom,
    0
  );

  return Math.hypot(horizontalDistance, verticalDistance);
}

function doesNodeOverlap(node, nodes) {
  const nodeRect = getNodeRect(node);

  return nodes.some(otherNode => {
    if (otherNode.id === node.id || otherNode.hidden) {
      return false;
    }

    return doRectsOverlap(nodeRect, getNodeRect(otherNode));
  });
}

function findNearbyNodeIds(nodes) {
  const nearbyIds = new Set();

  nodes.forEach((node, nodeIndex) => {
    if (node.hidden) {
      return;
    }

    const nodeRect = getNodeRect(node);

    nodes.slice(nodeIndex + 1).forEach(otherNode => {
      if (otherNode.hidden) {
        return;
      }

      const otherRect = getNodeRect(otherNode);

      if (
        doRectsOverlap(nodeRect, otherRect) ||
        getRectDistance(nodeRect, otherRect) <= NEAR_NODE_DISTANCE
      ) {
        nearbyIds.add(node.id);
        nearbyIds.add(otherNode.id);
      }
    });
  });

  return nearbyIds;
}

function withCollisionWarnings(nodes) {
  const nearbyIds = findNearbyNodeIds(nodes);

  return nodes.map(node => {
    const collisionWarning = nearbyIds.has(node.id);

    if (node.data?.collisionWarning === collisionWarning) {
      return node;
    }

    return {
      ...node,
      data: {
        ...node.data,
        collisionWarning
      }
    };
  });
}

function preventInitialOverlaps(nodes) {
  const placedNodes = [];

  return nodes.map(node => {
    let position = node.position;
    let candidateNode = { ...node, position };
    let attempts = 0;

    while (doesNodeOverlap(candidateNode, placedNodes) && attempts < 80) {
      const blockingNode = placedNodes.find(placedNode =>
        doRectsOverlap(getNodeRect(candidateNode), getNodeRect(placedNode))
      );

      if (!blockingNode) {
        break;
      }

      const blockingRect = getNodeRect(blockingNode);

      position = {
        x: position.x + (attempts % 2 === 0 ? MIN_NODE_GAP : PAGE_WIDTH / 3),
        y: blockingRect.bottom + MIN_NODE_GAP
      };
      candidateNode = { ...candidateNode, position };
      attempts += 1;
    }

    placedNodes.push(candidateNode);

    return candidateNode;
  });
}

function mergeGeneratedNodes(previousNodes, generatedNodes) {
  const previousNodeMap = new Map(previousNodes.map(node => [node.id, node]));

  return generatedNodes.map(node => {
    const previousNode = previousNodeMap.get(node.id);

    if (!previousNode) {
      return node;
    }

    return {
      ...node,
      position: previousNode.position,
      positionAbsolute: previousNode.positionAbsolute,
      selected: previousNode.selected,
      width: previousNode.width,
      height: previousNode.height,
      data: {
        ...node.data,
        collisionWarning: previousNode.data?.collisionWarning || false
      }
    };
  });
}

function makeFlowEdge(id, source, target, label = "") {
  return {
    id,
    source,
    target,
    label,
    type: "smoothstep",
    animated: false,
    style: {
      stroke: "#111827",
      strokeWidth: 2,
      strokeDasharray: "8 7"
    },
    labelStyle: {
      fill: "#15803d",
      fontWeight: 700
    },
    labelBgStyle: {
      fill: "#f0fdf4",
      stroke: "#bbf7d0"
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "#111827"
    }
  };
}

function FlowCanvasInner({
  pages = [],
  activePageId,
  onSelectPage,
  setSelectedItem
}) {
  const { fitView } = useReactFlow();
  const safePages = useMemo(() => (Array.isArray(pages) ? pages : []), [pages]);

  const generatedNodes = useMemo(() => {
    const pageNodes = safePages.map((page, index) => {
      const fields = getFieldElements(page.elements);
      const position = getPagePosition(index);

      return {
        id: `page-${page.id}`,
        type: "custom",
        position,
        data: {
          nodeKind: "flowPage",
          page,
          pageIndex: index,
          fields,
          active: page.id === activePageId,
          onSelectPage: () => onSelectPage?.(page.id),
          onSelectField: fieldId => {
            onSelectPage?.(page.id);
            setSelectedItem?.({ type: "node", id: fieldId });
          }
        },
        style: {
          width: PAGE_WIDTH
        }
      };
    });

    const firstPage = safePages[0];
    const lastPage = safePages[safePages.length - 1];

    return [
      {
        id: "flow-start",
        type: "custom",
        position: {
          x: 40,
          y: 165
        },
        data: {
          nodeKind: "flowStart"
        }
      },
      ...pageNodes,
      {
        id: "flow-end",
        type: "custom",
        position: lastPage
          ? {
            x: getPagePosition(safePages.length - 1).x + PAGE_GAP_X,
            y: getPagePosition(safePages.length - 1).y + 90
          }
          : {
            x: 650,
            y: 165
          },
        data: {
          nodeKind: "flowEnd"
        }
      },
      ...(firstPage
        ? []
        : [
          {
            id: "flow-empty",
            type: "custom",
            position: { x: 260, y: 110 },
            data: {
              nodeKind: "flowEmpty"
            },
            selectable: false,
            draggable: false
          }
        ])
    ];
  }, [activePageId, onSelectPage, safePages, setSelectedItem]);
  const [nodes, setNodes] = useState(() =>
    withCollisionWarnings(preventInitialOverlaps(generatedNodes))
  );

  const generatedEdges = useMemo(() => {
    if (!safePages.length) {
      return [];
    }

    const edges = [
      makeFlowEdge("start-to-first-page", "flow-start", `page-${safePages[0].id}`)
    ];

    safePages.forEach((page, index) => {
      const nextPage = safePages[index + 1];

      if (nextPage) {
        edges.push(
          makeFlowEdge(
            `page-${page.id}-to-page-${nextPage.id}`,
            `page-${page.id}`,
            `page-${nextPage.id}`,
            index === 0 ? "Next" : ""
          )
        );
      }
    });

    edges.push(
      makeFlowEdge(
        "last-page-to-end",
        `page-${safePages[safePages.length - 1].id}`,
        "flow-end"
      )
    );

    return edges;
  }, [safePages]);

  const handleNodesChange = useCallback(changes => {
    setNodes(currentNodes => {
      const positionChanges = changes.filter(
        change => change.type === "position" && change.position
      );
      const otherChanges = changes.filter(
        change => change.type !== "position" || !change.position
      );
      let nextNodes = otherChanges.length
        ? applyNodeChanges(otherChanges, currentNodes)
        : currentNodes;

      positionChanges.forEach(change => {
        const candidateNodes = applyNodeChanges([change], nextNodes);
        const movedNode = candidateNodes.find(node => node.id === change.id);

        if (!movedNode || doesNodeOverlap(movedNode, candidateNodes)) {
          nextNodes = applyNodeChanges(
            [
              {
                id: change.id,
                type: "position",
                dragging: change.dragging
              }
            ],
            nextNodes
          );
          return;
        }

        nextNodes = candidateNodes;
      });

      return withCollisionWarnings(nextNodes);
    });
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setNodes(currentNodes =>
        withCollisionWarnings(
          preventInitialOverlaps(mergeGeneratedNodes(currentNodes, generatedNodes))
        )
      );
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [generatedNodes]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      fitView({ duration: 450, maxZoom: 1.05, padding: 0.18 });
    });
  }, [fitView, nodes.length]);

  return (
    <div className="h-full min-h-0 overflow-hidden bg-white">
      <ReactFlow
        nodes={nodes}
        edges={generatedEdges}
        nodeTypes={nodeTypes}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        onNodesChange={handleNodesChange}
        fitView
        fitViewOptions={{ maxZoom: 1.05, padding: 0.18 }}
        onPaneClick={() => setSelectedItem?.(null)}
      >
        <Background color="#bbf7d0" gap={28} size={1} />
        <MiniMap
          pannable
          zoomable
          nodeColor="#dcfce7"
          maskColor="rgba(240,253,244,0.72)"
          className="!rounded-2xl !border !border-emerald-200 !bg-white"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function FlowCanvas(props) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
