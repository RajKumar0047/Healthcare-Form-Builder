import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  FaAlignLeft,
  FaCalendarAlt,
  FaCheckCircle,
  FaFont,
  FaLayerGroup,
  FaList,
  FaPhoneAlt,
  FaToggleOn,
  FaSearch
} from "react-icons/fa";

const componentGroups = [
  {
    id: "basic",
    title: "Basic fields",
    items: [
      {
        id: "input",
        label: "Single line text",
        icon: <FaFont />,
        description: "Short answers for names, email addresses, or identifiers."
      },
      {
        id: "textarea",
        label: "Multi line text",
        icon: <FaAlignLeft />,
        description: "Long-form answers for notes, symptoms, or summaries."
      }
    ]
  },
  {
    id: "choice",
    title: "Choice fields",
    items: [
      {
        id: "select",
        label: "Dropdown",
        icon: <FaList />,
        description: "Single-select dropdown with predefined options."
      },
      {
        id: "radio",
        label: "Radio group",
        icon: <FaCheckCircle />,
        description: "Visible choices for one answer from a short list."
      },
      {
        id: "yesno",
        label: "Yes / No toggle",
        icon: <FaToggleOn />,
        description: "Binary answer control for yes or no questions."
      }
    ]
  },
  {
    id: "contact",
    title: "Date and contact",
    items: [
      {
        id: "date",
        label: "Date field",
        icon: <FaCalendarAlt />,
        description: "Calendar date picker for visits, screenings, or follow-ups."
      },
      {
        id: "phone",
        label: "Phone number",
        icon: <FaPhoneAlt />,
        description: "Phone number input for patient or caregiver contact details."
      }
    ]
  },
  {
    id: "layout",
    title: "Layout elements",
    items: [
      {
        id: "section",
        label: "Section",
        icon: <FaLayerGroup />,
        description: "Container for grouping related fields inside the form."
      }
    ]
  }
];

export function ComponentDragPreview({ item }) {
  if (!item) {
    return null;
  }

  return (
    <div className="w-44 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-2xl pointer-events-none">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg text-emerald-600">
        {item.icon}
      </div>
      <div className="text-sm font-semibold text-slate-900">{item.label}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">
        Drop to add this component
      </div>
    </div>
  );
}

function ComponentInfoPopup({ item, onClose }) {
  if (!item) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4">
      <div className="relative w-full max-w-sm rounded-[1.6rem] border border-emerald-100 bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 h-9 w-9 rounded-xl border border-slate-200 text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600"
        >
          X
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-xl text-emerald-600">
          {item.icon}
        </div>

        <h3 className="text-lg font-semibold text-slate-900">{item.label}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
      </div>
    </div>
  );
}

function DraggableItem({ item, flowMode, onInfo, onDragItemChange }) {
  const { id, label, icon } = item;
  const { attributes, listeners, isDragging, setNodeRef } = useDraggable({
    id,
    data: {
      source: "sidebar",
      item: { id, label, icon }
    }
  });

  function handleNativeDragStart(event) {
    event.dataTransfer.setData("application/reactflow", id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleNativeDragEnd() {
    onDragItemChange?.(null);
  }

  return (
    <button
      type="button"
      ref={!flowMode ? setNodeRef : null}
      {...(!flowMode ? listeners : {})}
      {...(!flowMode ? attributes : {})}
      draggable={flowMode}
      onDragStart={flowMode ? handleNativeDragStart : undefined}
      onDragEnd={flowMode ? handleNativeDragEnd : undefined}
      onClick={() => onInfo(item)}
      className={`w-full rounded-xl border border-emerald-100 bg-white px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md ${
        isDragging && !flowMode ? "opacity-35" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm text-emerald-600">
          {icon}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-slate-900">
            {label}
          </span>
          <span className="block text-[11px] text-slate-500">
            Drag or tap for details
          </span>
        </span>
      </div>
    </button>
  );
}

export default function Sidebar({ flowMode, onDragItemChange }) {
  const [infoItem, setInfoItem] = useState(null);
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return componentGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (!normalizedQuery) {
            return true;
          }

          return `${item.label} ${item.description}`
            .toLowerCase()
            .includes(normalizedQuery);
        })
      }))
      .filter(group => group.items.length > 0);
  }, [query]);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 pr-12 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Field library
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Components</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Build the page from the left, fine-tune on the right, and use the center
          canvas to shape each page.
        </p>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-3 py-2.5 shadow-sm">
        <FaSearch className="text-sm text-slate-400" />
        <input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Search fields"
          className="w-full border-0 bg-transparent text-sm text-slate-700"
        />
      </label>

      <div className="mt-5 flex-1 space-y-4">
        {filteredGroups.map(group => (
          <section key={group.id}>
            <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
              {group.title}
            </h3>

            <div className="space-y-2.5">
              {group.items.map(item => (
                <DraggableItem
                  key={item.id}
                  item={item}
                  flowMode={flowMode}
                  onInfo={setInfoItem}
                  onDragItemChange={onDragItemChange}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 p-3 text-sm leading-6 text-emerald-800">
        Drag components into the center canvas. In flow view, drop a section first,
        then place fields inside that section node.
      </div>

      <ComponentInfoPopup item={infoItem} onClose={() => setInfoItem(null)} />
    </div>
  );
}
