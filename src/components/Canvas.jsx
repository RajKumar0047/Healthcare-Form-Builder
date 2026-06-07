import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import {
  FaAlignLeft,
  FaCheck,
  FaCheckCircle,
  FaChevronDown,
  FaEdit,
  FaFont,
  FaGripLines,
  FaLayerGroup,
  FaList,
  FaPlus
} from "react-icons/fa";

import DeleteButton from "./DeleteButton";
import FormElements from "./FormElements";

const fieldOptions = [
  {
    id: "input",
    label: "Single line",
    hint: "Short answer",
    icon: <FaFont />
  },
  {
    id: "textarea",
    label: "Long answer",
    hint: "Detailed response",
    icon: <FaAlignLeft />
  },
  {
    id: "select",
    label: "Dropdown",
    hint: "Select one option",
    icon: <FaList />
  },
  {
    id: "radio",
    label: "Radio group",
    hint: "Visible choices",
    icon: <FaCheckCircle />
  }
];

function FieldCard({ element, selectedId, onSelect, deleteElement }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 180ms cubic-bezier(0.2, 0, 0, 1)"
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      onClick={event => {
        event.stopPropagation();
        onSelect(element.id);
      }}
      className={`rounded-[1.2rem] border bg-white p-5 shadow-sm transition ${
        selectedId === element.id
          ? "border-emerald-400 shadow-[0_14px_30px_rgba(39,134,97,0.15)]"
          : "border-slate-200"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            {element.label}
          </div>
          <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">
            {element.type}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600"
            title="Drag field"
          >
            <FaGripLines />
          </button>

          <DeleteButton
            onClick={event => {
              event.stopPropagation();
              deleteElement(element.id);
            }}
            className="h-9 w-9 rounded-xl border border-slate-200 bg-white"
            title="Delete field"
          />
        </div>
      </div>

      <FormElements element={element} />
    </article>
  );
}

function SectionCard({
  section,
  fields,
  selectedId,
  onSelect,
  deleteElement,
  addFieldToSection,
  updateElement
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [sectionName, setSectionName] = useState(section.label || "");
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: section.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `section-drop-${section.id}`
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 180ms cubic-bezier(0.2, 0, 0, 1)"
  };

  function saveSectionName() {
    const nextName = sectionName.trim() || "Untitled Section";

    updateElement(section.id, { label: nextName });
    setSectionName(nextName);
    setIsRenaming(false);
  }

  return (
    <section
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(section.id)}
      className={`rounded-[1.4rem] border bg-white shadow-sm transition ${
        selectedId === section.id
          ? "border-emerald-400 shadow-[0_18px_36px_rgba(39,134,97,0.14)]"
          : "border-emerald-100"
      }`}
    >
      <header className="flex items-start justify-between gap-4 border-b border-emerald-100 bg-emerald-50/75 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <FaLayerGroup />
          </span>

          <div className="min-w-0">
            {isRenaming ? (
              <div
                className="flex max-w-md items-center gap-2"
                onClick={event => event.stopPropagation()}
              >
                <input
                  value={sectionName}
                  onChange={event => setSectionName(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === "Enter") {
                      saveSectionName();
                    }

                    if (event.key === "Escape") {
                      setSectionName(section.label || "");
                      setIsRenaming(false);
                    }
                  }}
                  autoFocus
                  className="min-w-0 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />

                <button
                  type="button"
                  onClick={saveSectionName}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
                  title="Save section name"
                >
                  <FaCheck />
                </button>
              </div>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate text-base font-semibold text-slate-900">
                  {section.label}
                </h3>

                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    setSectionName(section.label || "");
                    setIsRenaming(true);
                    onSelect(section.id);
                  }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                  title="Rename section"
                >
                  <FaEdit className="text-xs" />
                </button>
              </div>
            )}

            <p className="mt-1 text-sm text-slate-500">
              {section.description || "Organize related form fields in one section."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-white text-slate-400 transition hover:border-emerald-200 hover:text-emerald-600"
            title="Drag section"
          >
            <FaGripLines />
          </button>

          <DeleteButton
            onClick={event => {
              event.stopPropagation();
              deleteElement(section.id);
            }}
            className="h-9 w-9 rounded-xl border border-emerald-100 bg-white"
            title="Delete section"
          />
        </div>
      </header>

      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                setShowOptions(current => !current);
              }}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                showOptions
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
              aria-expanded={showOptions}
            >
              <FaPlus />
              Add fields
              <FaChevronDown
                className={`text-xs transition ${showOptions ? "rotate-180" : ""}`}
              />
            </button>

            {showOptions && (
              <div
                className="absolute left-0 top-12 z-30 w-72 overflow-hidden rounded-2xl border border-emerald-100 bg-white p-2 shadow-[0_18px_40px_rgba(30,84,65,0.16)]"
                onClick={event => event.stopPropagation()}
              >
                <div className="px-3 py-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">
                    Add field
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Choose a field type for this section.
                  </p>
                </div>

                <div className="mt-1 space-y-1">
                  {fieldOptions.map(option => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        addFieldToSection(option.id, section.id);
                        setShowOptions(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-emerald-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                        {option.icon}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">
                          {option.label}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {option.hint}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            {fields.length} item{fields.length === 1 ? "" : "s"}
          </span>
        </div>

        <div
          ref={setDropRef}
          className={`rounded-[1.2rem] border-2 border-dashed p-4 transition ${
            isOver
              ? "border-emerald-400 bg-emerald-50"
              : "border-emerald-100 bg-slate-50/70"
          }`}
        >
          {fields.length === 0 && (
            <div className="rounded-[1rem] border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-sm text-slate-500">
              Drag fields here or use the add fields button to populate this section.
            </div>
          )}

          <SortableContext
            items={fields.map(field => field.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {fields.map(field => (
                <FieldCard
                  key={field.id}
                  element={field}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  deleteElement={deleteElement}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
    </section>
  );
}

export default function Canvas({
  elements,
  setSelectedId,
  selectedId,
  deleteElement,
  addFieldToSection,
  addSection,
  updateElement
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas" });
  const designElements = elements.filter(element => element.type !== "condition");
  const topLevelElements = designElements.filter(element => !element.sectionId);

  return (
    <div
      ref={setNodeRef}
      onClick={() => setSelectedId(null)}
      className={`h-full overflow-y-auto rounded-[1.35rem] border border-emerald-100 bg-white p-4 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20 ${
        isOver ? "ring-2 ring-emerald-200 ring-offset-2 ring-offset-emerald-50" : ""
      }`}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={event => {
              event.stopPropagation();
              addSection();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <FaPlus />
            Add Section
          </button>
        </div>

        {designElements.length === 0 && (
          <div className="rounded-[1.4rem] border-2 border-dashed border-emerald-200 bg-emerald-50/45 px-6 py-16 text-center">
            <div className="mx-auto max-w-md">
              <div className="text-lg font-semibold text-slate-900">
                Start building this page
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Drag fields from the left library into this canvas. Use sections to
                create clear groups for healthcare intake, screening, or follow-up
                steps.
              </p>
            </div>
          </div>
        )}

        <SortableContext
          items={topLevelElements.map(element => element.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {topLevelElements.map(element =>
              element.type === "section" ? (
                <SectionCard
                  key={element.id}
                  section={element}
                  fields={designElements.filter(field => field.sectionId === element.id)}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  deleteElement={deleteElement}
                  addFieldToSection={addFieldToSection}
                  updateElement={updateElement}
                />
              ) : (
                <FieldCard
                  key={element.id}
                  element={element}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  deleteElement={deleteElement}
                />
              )
            )}
          </div>
        </SortableContext>

        {designElements.length > 0 && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={event => {
                event.stopPropagation();
                addSection();
              }}
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              <FaPlus />
              Add another section
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
