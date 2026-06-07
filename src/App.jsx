import {
  DragOverlay,
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import { useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCloudUploadAlt,
  FaDesktop,
  FaEdit,
  FaEye,
  FaGripVertical,
  FaHeartbeat,
  FaInfoCircle,
  FaMobileAlt,
  FaPlus,
  FaSave,
  FaTabletAlt,
  FaUndo
} from "react-icons/fa";

import Canvas from "./components/Canvas";
import DeleteButton from "./components/DeleteButton";
import PreviewFlow from "./components/PreviewFlow";
import PropertiesPanel from "./components/PropertiesPanel";
import Sidebar, { ComponentDragPreview } from "./components/Sidebar";
import FlowDetailsPanel from "./flow/FlowDetailsPanel";
import FlowOverviewPanel from "./flow/FlowOverviewPanel";
import FlowCanvas from "./flow/FlowCanvas";

const COMPONENT_TYPES = [
  "input",
  "textarea",
  "select",
  "radio",
  "date",
  "phone",
  "yesno",
  "section",
  "condition"
];

const FIELD_BLUEPRINTS = {
  input: {
    label: "Single line text",
    placeholder: "Enter response",
    description: "",
    options: []
  },
  textarea: {
    label: "Long answer",
    placeholder: "Enter detailed response",
    description: "",
    options: []
  },
  select: {
    label: "Dropdown",
    placeholder: "Select an option",
    description: "",
    options: ["Option 1", "Option 2"]
  },
  radio: {
    label: "Multiple choice",
    placeholder: "",
    description: "",
    options: ["Option 1", "Option 2"]
  },
  date: {
    label: "Date field",
    placeholder: "Select date",
    description: "",
    options: []
  },
  phone: {
    label: "Phone number",
    placeholder: "Enter phone number",
    description: "",
    options: []
  },
  yesno: {
    label: "Yes / No question",
    placeholder: "",
    description: "",
    options: ["Yes", "No"]
  },
  section: {
    label: "New Section",
    placeholder: "",
    description: "Group related fields together.",
    options: []
  },
  condition: {
    label: "Condition",
    placeholder: "",
    description: "Branch the flow based on a field or page rule.",
    options: ["Yes", "No"]
  }
};

function createElement(type, position, sectionId = null) {
  const blueprint = FIELD_BLUEPRINTS[type] || FIELD_BLUEPRINTS.input;
  const isSection = type === "section";

  return {
    id: crypto.randomUUID(),
    type,
    label: blueprint.label,
    placeholder: blueprint.placeholder,
    description: blueprint.description,
    options: [...blueprint.options],
    position,
    required: false,
    readOnly: false,
    sectionId: isSection ? null : sectionId
  };
}

function createPage(index) {
  return {
    id: crypto.randomUUID(),
    name: `Page ${index + 1}`,
    elements: [],
    edges: []
  };
}

function getDropTarget(elements, overId, draggedType) {
  if (!overId) {
    return null;
  }

  const dropId = String(overId);

  if (dropId === "canvas") {
    return { sectionId: null, overElementId: null };
  }

  if (dropId.startsWith("section-drop-")) {
    return {
      sectionId: dropId.replace("section-drop-", ""),
      overElementId: null
    };
  }

  const targetElement = elements.find(
    element => String(element.id) === dropId
  );

  if (!targetElement) {
    return { sectionId: null, overElementId: null };
  }

  if (targetElement.type === "section" && draggedType !== "section") {
    return {
      sectionId: targetElement.id,
      overElementId: null
    };
  }

  return {
    sectionId: targetElement.sectionId || null,
    overElementId: targetElement.id
  };
}

function placeElementInGroup(elements, movingElement, target) {
  const updatedElements = elements.filter(
    element => element.id !== movingElement.id
  );

  if (target?.overElementId) {
    const insertIndex = updatedElements.findIndex(
      element => element.id === target.overElementId
    );

    if (insertIndex >= 0) {
      updatedElements.splice(insertIndex, 0, movingElement);
      return updatedElements;
    }
  }

  if (movingElement.sectionId) {
    const sectionIndex = updatedElements.findIndex(
      element => element.id === movingElement.sectionId
    );
    let insertIndex = sectionIndex >= 0 ? sectionIndex + 1 : updatedElements.length;

    while (
      insertIndex < updatedElements.length &&
      updatedElements[insertIndex].sectionId === movingElement.sectionId
    ) {
      insertIndex += 1;
    }

    updatedElements.splice(insertIndex, 0, movingElement);
    return updatedElements;
  }

  const firstChildIndex = updatedElements.findIndex(
    element => element.sectionId
  );
  const insertIndex = firstChildIndex >= 0 ? firstChildIndex : updatedElements.length;

  updatedElements.splice(insertIndex, 0, movingElement);
  return updatedElements;
}

const initialPage = createPage(0);
const MIN_PANEL_WIDTH = 220;
const MAX_PANEL_WIDTH = 440;
const previewDevices = [
  { id: "desktop", label: "Desktop", icon: <FaDesktop /> },
  { id: "tablet", label: "Tablet", icon: <FaTabletAlt /> },
  { id: "mobile", label: "Mobile", icon: <FaMobileAlt /> }
];

function clampPanelWidth(width) {
  return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, width));
}

function getPreviewFields(elements) {
  return elements.filter(
    element => element.type !== "section" && element.type !== "condition"
  );
}

function countByType(elements, types) {
  return getPreviewFields(elements).filter(element => types.includes(element.type)).length;
}

function PreviewOptionsPanel({
  pages,
  activePageId,
  onSelectPage,
  previewDevice,
  setPreviewDevice,
  showFieldNumbers,
  setShowFieldNumbers,
  showLogicConditions,
  setShowLogicConditions,
  resetPreview
}) {
  const activePageIndex = Math.max(
    0,
    pages.findIndex(page => page.id === activePageId)
  );
  const progress = pages.length ? Math.round(((activePageIndex + 1) / pages.length) * 100) : 0;

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20">
      <div>
        <h2 className="text-base font-bold text-slate-950">Preview Options</h2>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-slate-800">Preview as</span>
        <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
          <option>Data Entry (Field User)</option>
          <option>Reviewer</option>
          <option>Administrator</option>
        </select>
      </label>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-slate-800">Device View</h3>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {previewDevices.map(device => (
            <button
              key={device.id}
              type="button"
              onClick={() => setPreviewDevice(device.id)}
              className={`flex h-12 items-center justify-center rounded-xl border text-lg transition ${
                previewDevice === device.id
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm"
                  : "border-transparent bg-white text-slate-500 hover:border-emerald-100 hover:text-emerald-700"
              }`}
              title={device.label}
            >
              {device.icon}
            </button>
          ))}
        </div>
      </section>

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-slate-800">Form Version</span>
        <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
          <option>v2 (Draft)</option>
          <option>v1 (Published)</option>
        </select>
      </label>

      <div className="mt-6 space-y-4">
        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={showFieldNumbers}
            onChange={event => setShowFieldNumbers(event.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Show Field Numbers
        </label>

        <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={showLogicConditions}
            onChange={event => setShowLogicConditions(event.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          Show Logic Conditions
        </label>
      </div>

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-slate-800">Language</span>
        <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
          <option>English</option>
          <option>Hindi</option>
          <option>Bengali</option>
        </select>
      </label>

      <label className="mt-6 block">
        <span className="text-sm font-semibold text-slate-800">Theme</span>
        <select className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100">
          <option>Light</option>
          <option>High contrast</option>
        </select>
      </label>

      <section className="mt-7">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-800">
          <span className="font-semibold">Form Progress (Preview)</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span>Step {activePageIndex + 1} of {pages.length}</span>
          <span className="font-semibold text-slate-700">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-emerald-400"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 space-y-2">
          {pages.map((page, index) => (
            <button
              key={page.id}
              type="button"
              onClick={() => onSelectPage(page.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                page.id === activePageId
                  ? "bg-emerald-50 text-emerald-700 shadow-sm"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs ${
                  page.id === activePageId
                    ? "border-transparent bg-gradient-to-br from-emerald-700 to-emerald-400 text-white"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {index + 1}
              </span>
              <span className="min-w-0 truncate">{page.name || `Page ${index + 1}`}</span>
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        onClick={resetPreview}
        className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
      >
        <FaUndo />
        Reset Preview
      </button>
    </div>
  );
}

function PreviewSummaryPanel({ pages, activePage, formTitle }) {
  const allElements = pages.flatMap(page => page.elements);
  const allFields = getPreviewFields(allElements);
  const activeLogicCount = activePage.edges.length;
  const estimatedMinutes = Math.max(2, Math.ceil(allFields.length * 0.45));

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-950">Form Summary</h2>
      </div>

      <div className="mt-6 space-y-5 text-sm">
        <div>
          <div className="font-semibold text-slate-800">Form Title</div>
          <p className="mt-2 text-slate-600">{formTitle}</p>
        </div>

        <div>
          <div className="font-semibold text-slate-800">Form Code</div>
          <p className="mt-2 text-slate-600">oral_cancer_screening</p>
        </div>

        <div>
          <div className="font-semibold text-slate-800">Version</div>
          <p className="mt-2 text-slate-600">v2 (Draft)</p>
        </div>

        <div>
          <div className="font-semibold text-slate-800">Total Steps</div>
          <p className="mt-2 text-slate-600">{pages.length}</p>
        </div>

        <div>
          <div className="font-semibold text-slate-800">Total Fields</div>
          <p className="mt-2 text-slate-600">{allFields.length}</p>
        </div>

        <div>
          <div className="font-semibold text-slate-800">Estimated Time</div>
          <p className="mt-2 text-slate-600">{estimatedMinutes}-{estimatedMinutes + 2} mins</p>
        </div>

        <div>
          <div className="font-semibold text-slate-800">Category</div>
          <p className="mt-2 text-slate-600">Health Screening</p>
        </div>

        <div>
          <div className="font-semibold text-slate-800">Tags</div>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Oral Cancer</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Screening</span>
          </div>
        </div>
      </div>

      <div className="my-6 h-px bg-slate-200" />

      <section>
        <h3 className="text-sm font-bold text-slate-900">Active Logic on this Step</h3>
        <div className="mt-4 flex items-start gap-3 text-sm">
          <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <FaInfoCircle className="text-xs" />
          </span>
          <div>
            <p className="font-semibold text-slate-800">
              {activeLogicCount ? `${activeLogicCount} condition${activeLogicCount === 1 ? "" : "s"} on this step` : "No conditions on this step"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {activeLogicCount
                ? "Connected fields may branch based on entered values."
                : "All fields on this step are always visible."}
            </p>
          </div>
        </div>
      </section>

      <div className="my-6 h-px bg-slate-200" />

      <section>
        <h3 className="text-sm font-bold text-slate-900">Field Type Breakdown</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <SummaryRow color="bg-blue-500" label="Text / Text Area" value={countByType(allElements, ["input", "textarea", "phone"])} />
          <SummaryRow color="bg-emerald-500" label="Select / Dropdown" value={countByType(allElements, ["select"])} />
          <SummaryRow color="bg-amber-400" label="Radio / Yes-No" value={countByType(allElements, ["radio", "yesno"])} />
          <SummaryRow color="bg-orange-500" label="Date / Time" value={countByType(allElements, ["date"])} />
          <SummaryRow color="bg-slate-400" label="Read Only / Auto" value={allFields.filter(field => field.readOnly).length} />
        </div>
      </section>

      <div className="mt-auto rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" />
          <p>
            <strong>This is a preview only.</strong>
            <span className="mt-1 block text-amber-800/80">
              To make changes, switch to Design or Flow mode.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ color, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${color}`} />
        <span className="truncate">{label}</span>
      </span>
      <strong>{value}</strong>
    </div>
  );
}

export default function App() {
  const [pages, setPages] = useState([initialPage]);
  const [activePageId, setActivePageId] = useState(initialPage.id);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState("design");
  const [activeSidebarItem, setActiveSidebarItem] = useState(null);
  const [formTitle, setFormTitle] = useState("Oral Cancer Screening Form (v2a)");
  const [leftPanelWidth, setLeftPanelWidth] = useState(290);
  const [rightPanelWidth, setRightPanelWidth] = useState(340);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [showFieldNumbers, setShowFieldNumbers] = useState(true);
  const [showLogicConditions, setShowLogicConditions] = useState(false);
  const [previewResetSignal, setPreviewResetSignal] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }
    })
  );

  const activePage =
    pages.find(page => page.id === activePageId) || pages[0];

  const selectedElement =
    selectedItem?.type === "node"
      ? activePage.elements.find(element => element.id === selectedItem.id)
      : null;

  const selectedEdge =
    selectedItem?.type === "edge"
      ? activePage.edges.find(edge => edge.id === selectedItem.id)
      : null;

  function updateActivePage(updater) {
    setPages(prevPages =>
      prevPages.map(page => (page.id === activePageId ? updater(page) : page))
    );
  }

  function setPageElements(updated) {
    updateActivePage(page => ({
      ...page,
      elements:
        typeof updated === "function"
          ? updated(page.elements)
          : updated
    }));
  }

  function setPageEdges(updated) {
    updateActivePage(page => ({
      ...page,
      edges:
        typeof updated === "function"
          ? updated(page.edges)
          : updated
    }));
  }

  function addElement(type, position, sectionId = null) {
    setPageElements(prevElements => [
      ...prevElements,
      createElement(type, position, sectionId)
    ]);
  }

  function updateElement(id, updated) {
    setPageElements(prevElements =>
      prevElements.map(element =>
        element.id === id
          ? { ...element, ...updated }
          : element
        )
    );
  }

  function updateEdge(id, condition) {
    setPageEdges(prevEdges =>
      prevEdges.map(edge =>
        edge.id === id
          ? {
              ...edge,
              label: condition,
              data: {
                ...edge.data,
                condition
              }
            }
          : edge
        )
    );
  }

  function deleteElement(id) {
    updateActivePage(page => ({
      ...page,
      elements: page.elements.filter(element => element.id !== id),
      edges: page.edges.filter(
        edge => edge.source !== id && edge.target !== id
      )
    }));

    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  }

  function renamePage(pageId, name) {
    setPages(prevPages =>
      prevPages.map(page =>
        page.id === pageId
          ? {
              ...page,
              name
            }
          : page
      )
    );
  }

  function addPage() {
    const newPage = createPage(pages.length);

    setPages(prevPages => [...prevPages, newPage]);
    setActivePageId(newPage.id);
    setSelectedItem(null);
  }

  function deletePage(pageId) {
    if (pages.length === 1) {
      return;
    }

    const nextPages = pages.filter(page => page.id !== pageId);

    setPages(nextPages);

    if (activePageId === pageId) {
      setActivePageId(nextPages[0].id);
      setSelectedItem(null);
    }
  }

  function handleDragStart(event) {
    const draggedItem = event.active.data.current?.item;

    if (draggedItem) {
      setActiveSidebarItem(draggedItem);
    }
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    const draggedType = String(active.id);
    const draggedFromSidebar =
      active.data.current?.source === "sidebar" &&
      COMPONENT_TYPES.includes(draggedType);

    setActiveSidebarItem(null);

    if (!over) {
      return;
    }

    const target = getDropTarget(activePage.elements, over.id, draggedType);

    if (!target) {
      return;
    }

    if (draggedFromSidebar) {
      if (draggedType === "section" && target.sectionId) {
        return;
      }

      addElement(draggedType, undefined, target.sectionId);
      return;
    }

    if (active.id === over.id) {
      return;
    }

    const movingElement = activePage.elements.find(
      element => element.id === active.id
    );

    if (!movingElement) {
      return;
    }

    if (movingElement.type === "section" && target.sectionId) {
      return;
    }

    const nextSectionId =
      movingElement.type === "section" ? null : target.sectionId;

    const nextElements = activePage.elements.map(element =>
      element.id === movingElement.id
        ? {
            ...element,
            sectionId: nextSectionId
          }
        : element
    );

    const movedElement = nextElements.find(
      element => element.id === movingElement.id
    );

    setPageElements(placeElementInGroup(nextElements, movedElement, target));
  }

  function handleDragCancel() {
    setActiveSidebarItem(null);
  }

  function switchPage(pageId) {
    setActivePageId(pageId);
    setSelectedItem(null);
  }

  function triggerSaveDraft() {
    console.info("Draft saved");
  }

  function triggerPublish() {
    console.info("Form published");
  }

  function switchViewMode(mode) {
    setViewMode(mode);
    setSelectedItem(null);

    if (mode === "preview") {
      setLeftPanelCollapsed(false);
      setRightPanelCollapsed(false);
    }
  }

  function handlePanelResizeStart(side, event) {
    event.preventDefault();

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(moveEvent) {
      if (side === "left") {
        setLeftPanelWidth(clampPanelWidth(moveEvent.clientX));
        return;
      }

      setRightPanelWidth(clampPanelWidth(window.innerWidth - moveEvent.clientX));
    }

    function handlePointerUp() {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div
        className="flex h-screen flex-col overflow-hidden bg-[linear-gradient(135deg,rgba(245,251,247,0.95),rgba(233,246,239,0.92))] text-[#173a32]"
        style={{ fontFamily: 'Aptos, "Segoe UI", "Trebuchet MS", sans-serif' }}
      >
        <header className="grid grid-cols-[auto_minmax(240px,1fr)_auto] items-center gap-5 border-b border-emerald-950/10 bg-white/90 px-6 py-1 backdrop-blur-xl max-[1380px]:grid-cols-1">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-400 text-xl text-white shadow-[0_12px_30px_rgba(52,185,135,0.3)]">
              <FaHeartbeat />
            </div>

            <div className="flex flex-col gap-0.5">
              <strong className="text-[1.05rem]">PHC Platform</strong>
              <span className="text-sm text-[#618376]">Medical Drive</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-[#5d7d72]">
              <span>Form Builder</span>
              <FaChevronRight className="text-xs" />
              <span>Healthcare Screening</span>
            </div>

            <label className="inline-flex max-w-full items-center gap-2 text-[#173a32]">
              <input
                value={formTitle}
                onChange={event => setFormTitle(event.target.value)}
                aria-label="Form title"
                className="w-[min(100%,28rem)] border-0 bg-transparent p-0 text-xl font-bold text-inherit outline-none"
              />
              <FaEdit className="shrink-0 text-sm text-[#7ba294]" />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 justify-self-end max-[1380px]:justify-self-start">
            <div
              className="inline-flex items-center gap-1 rounded-2xl border border-emerald-700/10 bg-emerald-50 p-1"
              role="tablist"
              aria-label="View mode"
            >
              <button
                type="button"
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 font-semibold transition ${
                  viewMode === "design"
                    ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(18,112,72,0.18)]"
                    : "text-[#4a6d61] hover:bg-white/70"
                }`}
                onClick={() => switchViewMode("design")}
              >
                Design
              </button>

              <button
                type="button"
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 font-semibold transition ${
                  viewMode === "flow"
                    ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(18,112,72,0.18)]"
                    : "text-[#4a6d61] hover:bg-white/70"
                }`}
                onClick={() => switchViewMode("flow")}
              >
                Flow
              </button>

              <button
                type="button"
                className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 font-semibold transition ${
                  viewMode === "preview"
                    ? "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(18,112,72,0.18)]"
                    : "text-[#4a6d61] hover:bg-white/70"
                }`}
                onClick={() => switchViewMode("preview")}
              >
                <FaEye />
                Preview
              </button>
            </div>

            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              Draft
            </span>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-emerald-950/10 bg-white px-4 text-[#184d3d] shadow-[0_10px_24px_rgba(33,89,68,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(33,89,68,0.12)]"
              onClick={triggerSaveDraft}
            >
              <FaSave />
              Save Draft
            </button>

            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-transparent bg-gradient-to-br from-emerald-700 to-emerald-400 px-4 text-white shadow-[0_10px_24px_rgba(33,89,68,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(33,89,68,0.12)]"
              onClick={triggerPublish}
            >
              <FaCloudUploadAlt />
              Publish
            </button>
          </div>
        </header>

        <div
          className="grid min-h-0 flex-1 overflow-hidden transition-[grid-template-columns] duration-300 ease-out"
          style={{
            gridTemplateColumns:
              viewMode === "preview"
                ? "290px minmax(0, 1fr) 340px"
                : `${leftPanelCollapsed ? 52 : leftPanelWidth}px minmax(0, 1fr) ${rightPanelCollapsed ? 52 : rightPanelWidth}px`
          }}
        >
          <aside className="relative min-h-0 border-r border-emerald-950/10 bg-white/80 backdrop-blur-xl">
            {viewMode === "preview" ? (
              <PreviewOptionsPanel
                pages={pages}
                activePageId={activePageId}
                onSelectPage={switchPage}
                previewDevice={previewDevice}
                setPreviewDevice={setPreviewDevice}
                showFieldNumbers={showFieldNumbers}
                setShowFieldNumbers={setShowFieldNumbers}
                showLogicConditions={showLogicConditions}
                setShowLogicConditions={setShowLogicConditions}
                resetPreview={() => setPreviewResetSignal(signal => signal + 1)}
              />
            ) : leftPanelCollapsed ? (
              <div className="flex h-full flex-col items-center gap-4 py-4">
                <button
                  type="button"
                  onClick={() => setLeftPanelCollapsed(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  title="Show field library"
                >
                  <FaChevronRight />
                </button>
                <span className="[writing-mode:vertical-rl] text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  Library
                </span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLeftPanelCollapsed(true)}
                  className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  title="Hide field library"
                >
                  <FaChevronLeft />
                </button>
                {viewMode === "flow" ? (
                  <FlowOverviewPanel />
                ) : (
                  <Sidebar
                    flowMode={false}
                    onDragItemChange={setActiveSidebarItem}
                  />
                )}
                <button
                  type="button"
                  onPointerDown={event => handlePanelResizeStart("left", event)}
                  className="absolute -right-1 top-0 z-20 flex h-full w-2 cursor-col-resize items-center justify-center text-transparent transition hover:bg-emerald-200/60 hover:text-emerald-700"
                  title="Resize field library"
                >
                  <FaGripVertical className="text-xs" />
                </button>
              </>
            )}
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col">
            {viewMode !== "preview" && (
            <div className="flex items-center justify-between gap-3 px-5 pt-3">
              <div
                className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20"
                role="tablist"
                aria-label="Form pages"
              >
                {pages.map((page, index) => (
                  <div
                    key={page.id}
                    className={`inline-flex min-w-36 max-w-44 cursor-pointer items-center gap-2 rounded-t-2xl rounded-b-lg border-b-[3px] px-3 py-2 ${
                      page.id === activePageId
                        ? "border-emerald-500 bg-white/95 text-[#12372f] shadow-[0_12px_24px_rgba(35,95,73,0.08)]"
                        : "border-transparent bg-white/60 text-[#507267] hover:bg-white/80"
                    }`}
                    onClick={() => switchPage(page.id)}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        switchPage(page.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        page.id === activePageId
                          ? "bg-gradient-to-br from-emerald-700 to-emerald-400 text-white"
                          : "bg-emerald-600/10 text-emerald-700"
                      }`}
                    >
                      {index + 1}
                    </span>

                    <input
                      value={page.name}
                      onChange={event => renamePage(page.id, event.target.value)}
                      onClick={event => event.stopPropagation()}
                      className="min-w-0 flex-1 border-0 bg-transparent text-sm font-semibold text-inherit outline-none"
                      aria-label={`Page ${index + 1} name`}
                    />

                    {pages.length > 1 && (
                      <DeleteButton
                        onClick={event => {
                          event.stopPropagation();
                          deletePage(page.id);
                        }}
                        className="h-7 w-7 rounded-lg bg-white/80"
                        title="Delete page"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-2xl border border-emerald-950/10 bg-white px-3 text-sm font-semibold text-[#184d3d] shadow-[0_10px_24px_rgba(33,89,68,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(33,89,68,0.12)]"
                onClick={addPage}
              >
                <FaPlus />
                Add Page
              </button>
            </div>
            )}

            <div className={`min-h-0 flex-1 ${viewMode === "preview" ? "p-0" : "p-3 pt-2"}`}>
              {viewMode === "preview" ? (
                <PreviewFlow
                  elements={activePage.elements}
                  edges={activePage.edges}
                  sections={activePage.elements.filter(
                    element => element.type === "section"
                  )}
                  formTitle={formTitle}
                  pageName={activePage.name}
                  pages={pages}
                  activePageId={activePageId}
                  onSelectPage={switchPage}
                  previewDevice={previewDevice}
                  showFieldNumbers={showFieldNumbers}
                  showLogicConditions={showLogicConditions}
                  resetSignal={previewResetSignal}
                />
              ) : (
              <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.8rem] border border-emerald-950/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,251,247,0.96))] shadow-[0_24px_60px_rgba(29,81,63,0.09)]">
                <div
                  className={`min-h-0 flex-1 bg-[linear-gradient(180deg,rgba(223,244,233,0.4),rgba(238,249,243,0.5))] p-3 ${
                    viewMode === "split"
                      ? "grid grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] gap-3 max-[1120px]:grid-cols-1"
                      : ""
                  }`}
                >
                  {viewMode === "design" && (
                    <Canvas
                      elements={activePage.elements}
                      selectedId={selectedElement?.id}
                      deleteElement={deleteElement}
                      addFieldToSection={(type, sectionId) =>
                        addElement(type, undefined, sectionId)
                      }
                      addSection={() => addElement("section")}
                      updateElement={updateElement}
                      setSelectedId={id =>
                        setSelectedItem(id ? { type: "node", id } : null)
                      }
                    />
                  )}

                  {viewMode === "flow" && (
                    <FlowCanvas
                      pageName={activePage.name}
                      pages={pages}
                      activePageId={activePageId}
                      onSelectPage={switchPage}
                      elements={activePage.elements}
                      edges={activePage.edges}
                      setEdges={setPageEdges}
                      setElements={setPageElements}
                      addElementFromFlow={addElement}
                      setSelectedItem={setSelectedItem}
                      deleteElement={deleteElement}
                    />
                  )}

                  {viewMode === "split" && (
                    <>
                      <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.4rem] border border-emerald-950/10 bg-white/80">
                        <div className="flex items-center justify-between gap-4 border-b border-emerald-950/10 px-4 py-3">
                          <span>Design view</span>
                          <small className="text-[#67897c]">Live page canvas</small>
                        </div>

                        <Canvas
                          elements={activePage.elements}
                          selectedId={selectedElement?.id}
                          deleteElement={deleteElement}
                          addFieldToSection={(type, sectionId) =>
                            addElement(type, undefined, sectionId)
                          }
                          addSection={() => addElement("section")}
                          updateElement={updateElement}
                          setSelectedId={id =>
                            setSelectedItem(id ? { type: "node", id } : null)
                          }
                        />
                      </section>

                      <section className="flex min-h-0 flex-col overflow-hidden rounded-[1.4rem] border border-emerald-950/10 bg-white/80">
                        <div className="flex items-center justify-between gap-4 border-b border-emerald-950/10 px-4 py-3">
                          <span>Flow view</span>
                          <small className="text-[#67897c]">Logic connections</small>
                        </div>

                        <FlowCanvas
                          pageName={activePage.name}
                          pages={pages}
                          activePageId={activePageId}
                          onSelectPage={switchPage}
                          elements={activePage.elements}
                          edges={activePage.edges}
                          setEdges={setPageEdges}
                          setElements={setPageElements}
                          addElementFromFlow={addElement}
                          setSelectedItem={setSelectedItem}
                          deleteElement={deleteElement}
                        />
                      </section>
                    </>
                  )}
                </div>
              </div>
              )}
            </div>
          </main>

          <aside className="relative min-h-0 border-l border-emerald-950/10 bg-white/80 backdrop-blur-xl">
            {viewMode === "preview" ? (
              <PreviewSummaryPanel
                pages={pages}
                activePage={activePage}
                formTitle={formTitle}
              />
            ) : rightPanelCollapsed ? (
              <div className="flex h-full flex-col items-center gap-4 py-4">
                <button
                  type="button"
                  onClick={() => setRightPanelCollapsed(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  title="Show field properties"
                >
                  <FaChevronLeft />
                </button>
                <span className="[writing-mode:vertical-rl] text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  {viewMode === "flow" ? "Details" : "Properties"}
                </span>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onPointerDown={event => handlePanelResizeStart("right", event)}
                  className="absolute -left-1 top-0 z-20 flex h-full w-2 cursor-col-resize items-center justify-center text-transparent transition hover:bg-emerald-200/60 hover:text-emerald-700"
                  title="Resize field properties"
                >
                  <FaGripVertical className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelCollapsed(true)}
                  className="absolute right-3 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                  title="Hide field properties"
                >
                  <FaChevronRight />
                </button>
                {viewMode === "flow" ? (
                  <FlowDetailsPanel
                    selectedElement={selectedElement}
                    selectedEdge={selectedEdge}
                    updateElement={updateElement}
                    updateEdge={updateEdge}
                    elements={activePage.elements}
                    edges={activePage.edges}
                    pageName={activePage.name}
                  />
                ) : (
                  <PropertiesPanel
                    selectedElement={selectedElement}
                    selectedEdge={selectedEdge}
                    updateElement={updateElement}
                    updateEdge={updateEdge}
                  />
                )}
              </>
            )}
          </aside>
        </div>
      </div>

      <DragOverlay>
        <ComponentDragPreview item={activeSidebarItem} />
      </DragOverlay>
    </DndContext>
  );
}
