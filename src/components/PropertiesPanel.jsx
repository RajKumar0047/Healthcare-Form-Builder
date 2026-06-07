import { FaProjectDiagram } from "react-icons/fa";

import DeleteButton from "./DeleteButton";

function SectionLabel({ children }) {
  return (
    <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
      {children}
    </h4>
  );
}

function TextField({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder = "" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
      />
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex h-7 w-12 items-center rounded-full p-1 transition ${
          checked ? "bg-emerald-500 justify-end" : "bg-slate-200 justify-start"
        }`}
      >
        <span className="h-5 w-5 rounded-full bg-white shadow-sm" />
      </button>
    </label>
  );
}

function OptionsEditor({ options = [], onChange }) {
  function updateOption(index, value) {
    onChange(options.map((option, optionIndex) =>
      optionIndex === index ? value : option
    ));
  }

  function deleteOption(index) {
    onChange(options.filter((_, optionIndex) => optionIndex !== index));
  }

  function addOption() {
    onChange([...options, `Option ${options.length + 1}`]);
  }

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <div key={`${option}-${index}`} className="flex items-center gap-2">
          <input
            value={option}
            onChange={event => updateOption(index, event.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
          />

          <DeleteButton
            onClick={() => deleteOption(index)}
            className="h-11 w-11 rounded-2xl border border-slate-200 bg-white"
            title="Delete option"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={addOption}
        className="w-full rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
      >
        Add option
      </button>
    </div>
  );
}

export default function PropertiesPanel({
  selectedElement,
  selectedEdge,
  updateElement,
  updateEdge
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 pr-12 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Field properties
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Inspector</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Select a field or a flow connection to edit labels, helper copy, and
          rules for the active page.
        </p>
      </div>

      {!selectedElement && !selectedEdge && (
        <div className="rounded-[1.6rem] border border-dashed border-emerald-200 bg-emerald-50/70 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <FaProjectDiagram />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Nothing selected
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Click any field, section, or connection in the builder to edit its
            configuration here.
          </p>
        </div>
      )}

      {selectedElement && (
        <div className="space-y-6">
          <section className="space-y-4 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
            <SectionLabel>Overview</SectionLabel>

            <div className="rounded-2xl bg-emerald-50 px-4 py-3">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                Field type
              </div>
              <div className="mt-1 text-sm font-semibold capitalize text-slate-900">
                {selectedElement.type}
              </div>
            </div>

            <TextField
              label={selectedElement.type === "section" ? "Section name" : "Field label"}
              value={selectedElement.label || ""}
              onChange={label => updateElement(selectedElement.id, { label })}
            />

            <TextAreaField
              label="Description"
              value={selectedElement.description || ""}
              onChange={description =>
                updateElement(selectedElement.id, { description })
              }
              placeholder="Explain how this field should be used."
            />

            {selectedElement.type !== "section" &&
              selectedElement.type !== "radio" &&
              selectedElement.type !== "yesno" && (
              <TextField
                label="Placeholder"
                value={selectedElement.placeholder || ""}
                onChange={placeholder =>
                  updateElement(selectedElement.id, { placeholder })
                }
                placeholder="Enter placeholder text"
              />
            )}
          </section>

          {selectedElement.type !== "section" && (
            <section className="space-y-4 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
              <SectionLabel>Behavior</SectionLabel>

              <ToggleField
                label="Required field"
                checked={selectedElement.required || false}
                onChange={required =>
                  updateElement(selectedElement.id, { required })
                }
              />

              <ToggleField
                label="Read only"
                checked={selectedElement.readOnly || false}
                onChange={readOnly =>
                  updateElement(selectedElement.id, { readOnly })
                }
              />
            </section>
          )}

          {(selectedElement.type === "select" ||
            selectedElement.type === "radio" ||
            selectedElement.type === "yesno") && (
            <section className="space-y-4 rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
              <SectionLabel>Options</SectionLabel>
              <OptionsEditor
                options={selectedElement.options || []}
                onChange={options =>
                  updateElement(selectedElement.id, { options })
                }
              />
            </section>
          )}
        </div>
      )}

      {selectedEdge && (
        <div className="rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm">
          <SectionLabel>Flow rule</SectionLabel>

          <div className="mt-4">
            <TextField
              label="Condition label"
              value={selectedEdge.data?.condition || ""}
              onChange={condition => updateEdge(selectedEdge.id, condition)}
              placeholder="Yes, No, Completed..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
