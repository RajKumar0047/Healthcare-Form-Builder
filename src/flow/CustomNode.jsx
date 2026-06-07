import { useState } from "react";
import { Handle, Position } from "reactflow";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaFileAlt,
  FaFont,
  FaList,
  FaPhoneAlt,
  FaPlay,
  FaPlus,
  FaStop,
  FaToggleOn
} from "react-icons/fa";

const conditionOptions = [
  "Show field if answer equals",
  "Skip to page when true",
  "Require before continuing",
  "Branch to another step"
];

function getFieldIcon(type) {
  if (type === "select") return <FaList />;
  if (type === "radio") return <FaCheckCircle />;
  if (type === "date") return <FaCalendarAlt />;
  if (type === "phone") return <FaPhoneAlt />;
  if (type === "yesno") return <FaToggleOn />;
  return <FaFont />;
}

function getFieldTypeName(type) {
  if (type === "textarea") return "Text Area";
  if (type === "select") return "Dropdown";
  if (type === "radio") return "Radio";
  if (type === "date") return "Date";
  if (type === "phone") return "Phone";
  if (type === "yesno") return "Yes/No";
  return "Text";
}

function ConditionMenu({ label = "Add condition" }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="nodrag relative">
      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          setOpen(current => !current);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-amber-300 bg-amber-300 text-xs text-amber-950 shadow-[0_8px_18px_rgba(217,119,6,0.22)] transition hover:bg-amber-400"
        title={label}
      >
        <FaPlus />
      </button>

      {open && (
        <div
          className="absolute right-0 top-9 z-50 w-60 overflow-hidden rounded-xl border border-amber-200 bg-white p-2 text-left shadow-[0_18px_40px_rgba(30,84,65,0.18)]"
          onClick={event => event.stopPropagation()}
        >
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
            Conditions
          </div>
          {conditionOptions.map(option => (
            <button
              key={option}
              type="button"
              onClick={() => setOpen(false)}
              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition hover:bg-amber-50 hover:text-amber-800"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FlowPageNode({ data }) {
  const {
    page,
    pageIndex,
    fields,
    active,
    collisionWarning,
    onSelectPage,
    onSelectField
  } = data;
  const borderClassName = collisionWarning
    ? "border-red-500 ring-4 ring-red-100"
    : active
      ? "border-emerald-500 ring-4 ring-emerald-100"
      : "border-emerald-400";

  return (
    <div
      className={`relative cursor-move rounded-xl border bg-gradient-to-br from-emerald-50 to-white p-3 shadow-[0_16px_38px_rgba(30,84,65,0.14)] transition ${borderClassName}`}
      onClick={onSelectPage}
    >
      <Handle
        id="target"
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-white !bg-emerald-600"
      />

      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <FaFileAlt className="shrink-0 text-emerald-700" />
          <span className="truncate text-sm font-bold text-emerald-800">
            {pageIndex + 1}. {page.name || `Page ${pageIndex + 1}`}
          </span>
        </div>
        <ConditionMenu label="Add page condition" />
      </div>

      <div className="space-y-2">
        {fields.length === 0 && (
          <div className="rounded-lg border border-dashed border-emerald-200 bg-white/80 px-3 py-3 text-xs font-semibold text-slate-500">
            No fields in this page
          </div>
        )}

        {fields.map(field => (
          <div
            key={field.id}
            role="button"
            tabIndex={0}
            onClick={event => {
              event.stopPropagation();
              onSelectField?.(field.id);
            }}
            onKeyDown={event => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectField?.(field.id);
              }
            }}
            className="nodrag group flex items-center gap-2 rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 text-left shadow-sm transition hover:border-emerald-400 hover:bg-white"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-xs text-emerald-700">
              {getFieldIcon(field.type)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-slate-800">
                {field.label || "Untitled field"}
              </span>
              <span className="block truncate text-[10px] font-semibold text-slate-500">
                {getFieldTypeName(field.type)}
                {field.required ? " / Required" : ""}
              </span>
            </span>
            <ConditionMenu label="Add field condition" />
          </div>
        ))}
      </div>

      <Handle
        id="source"
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-white !bg-emerald-600"
      />
    </div>
  );
}

export default function CustomNode({ data }) {
  if (data?.nodeKind === "flowStart") {
    const borderClassName = data.collisionWarning
      ? "border-red-500 ring-4 ring-red-100"
      : "border-emerald-400";

    return (
      <div className={`relative flex cursor-move items-center gap-3 rounded-xl border bg-emerald-50 px-5 py-4 text-emerald-800 shadow-sm transition ${borderClassName}`}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600 text-white">
          <FaPlay className="text-xs" />
        </span>
        <strong>Start</strong>
        <Handle
          id="source"
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-2 !border-white !bg-emerald-600"
        />
      </div>
    );
  }

  if (data?.nodeKind === "flowEnd") {
    const borderClassName = data.collisionWarning
      ? "border-red-500 ring-4 ring-red-100"
      : "border-red-300";

    return (
      <div className={`relative flex cursor-move items-center gap-3 rounded-xl border bg-red-50 px-5 py-4 text-red-700 shadow-sm transition ${borderClassName}`}>
        <Handle
          id="target"
          type="target"
          position={Position.Left}
          className="!h-3 !w-3 !border-2 !border-white !bg-red-500"
        />
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500 text-white">
          <FaStop className="text-xs" />
        </span>
        <strong>End</strong>
      </div>
    );
  }

  if (data?.nodeKind === "flowEmpty") {
    return (
      <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50 px-8 py-10 text-center text-sm font-semibold text-emerald-800">
        Add pages and fields in Design mode to generate the flow map.
      </div>
    );
  }

  return <FlowPageNode data={data} />;
}
