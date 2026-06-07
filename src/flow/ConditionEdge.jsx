import { useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "reactflow";

const conditionOptions = ["Yes", "No", "Option 1", "Option 2", "Complete"];

export default function ConditionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });
  const normalizedCondition = String(data?.condition || "").toLowerCase();
  const isNoPath = normalizedCondition === "no" || normalizedCondition.includes("false");
  const strokeColor = isNoPath ? "#ef4444" : "#22a06b";

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: strokeColor,
          strokeWidth: 2.5,
          strokeDasharray: data?.condition ? "7 6" : undefined
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="absolute nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all"
          }}
        >
          <button
            type="button"
            onClick={() => setIsOpen(current => !current)}
            className={`flex h-8 min-w-8 items-center justify-center rounded-full border border-white px-2 text-xs font-semibold text-white shadow-lg ${
              isNoPath ? "bg-red-500" : "bg-emerald-600"
            }`}
          >
            {data?.condition || "+"}
          </button>

          {isOpen && (
            <div className="absolute left-1/2 top-10 w-32 -translate-x-1/2 rounded-2xl border border-emerald-100 bg-white p-2 shadow-xl">
              {conditionOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    data?.onConditionChange?.(id, option);
                    setIsOpen(false);
                  }}
                  className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-emerald-50"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
