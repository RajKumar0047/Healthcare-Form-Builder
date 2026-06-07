import { FaCheckCircle, FaInfoCircle, FaProjectDiagram } from "react-icons/fa";

function PanelSection({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
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
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function getNodeLabel(elements, nodeId, pageName) {
  if (nodeId === "__page-frame") {
    return pageName;
  }

  return elements.find(element => element.id === nodeId)?.label || "Unknown node";
}

export default function FlowDetailsPanel({
  selectedElement,
  selectedEdge,
  updateElement,
  updateEdge,
  elements,
  edges,
  pageName
}) {
  const incomingEdges = selectedElement
    ? edges.filter(edge => edge.target === selectedElement.id)
    : [];
  const outgoingEdges = selectedElement
    ? edges.filter(edge => edge.source === selectedElement.id)
    : [];

  return (
    <div className="flex h-full flex-col overflow-y-auto p-5 pr-12 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Field / node details
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Flow inspector</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Review selected node metadata and edit the logic label for connected
          conditions.
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
            Select a field, section, condition, page frame, or edge in the flow
            canvas to inspect its logic.
          </p>
        </div>
      )}

      {selectedElement && (
        <div className="space-y-5">
          <PanelSection title="Selected node">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {selectedElement.label || selectedElement.type}
            </div>

            <div className="mt-4 grid gap-4">
              <DetailRow label="Node type" value={selectedElement.type} />
              <DetailRow
                label="Required"
                value={selectedElement.required ? "Yes" : "No"}
              />
              <DetailRow
                label="Page"
                value={selectedElement.type === "page" ? selectedElement.label : pageName}
              />
              {selectedElement.sectionId && (
                <DetailRow
                  label="Section"
                  value={
                    elements.find(element => element.id === selectedElement.sectionId)
                      ?.label || "Unknown section"
                  }
                />
              )}
            </div>
          </PanelSection>

          <PanelSection title="Node label">
            <TextField
              label="Name"
              value={selectedElement.label || ""}
              onChange={label => updateElement(selectedElement.id, { label })}
              placeholder="Node name"
            />
          </PanelSection>

          <PanelSection title="Condition / logic">
            {selectedElement.type === "condition" && (
              <div className="space-y-4">
                <TextField
                  label="Condition question"
                  value={selectedElement.description || ""}
                  onChange={description =>
                    updateElement(selectedElement.id, { description })
                  }
                  placeholder="Example: Tobacco Use = Yes?"
                />
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800">
                  Connect incoming fields to this condition and connect outgoing
                  paths with labels like Yes or No.
                </div>
              </div>
            )}

            {selectedElement.type !== "condition" && (
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500" />
                  Required fields gate page continuation in the preview flow.
                </div>
                <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
                  <FaInfoCircle className="mt-1 shrink-0" />
                  Add a condition node when this field should decide whether
                  another field or page should appear.
                </div>
              </div>
            )}
          </PanelSection>

          <PanelSection title="Connections">
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <div className="font-semibold text-slate-900">Connected from</div>
                <div className="mt-2 space-y-2">
                  {incomingEdges.length ? (
                    incomingEdges.map(edge => (
                      <div key={edge.id} className="rounded-xl bg-slate-50 px-3 py-2">
                        {getNodeLabel(elements, edge.source, pageName)}{" "}
                        {edge.data?.condition ? `= ${edge.data.condition}` : ""}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">No incoming connections</div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-900">Connected to</div>
                <div className="mt-2 space-y-2">
                  {outgoingEdges.length ? (
                    outgoingEdges.map(edge => (
                      <div key={edge.id} className="rounded-xl bg-slate-50 px-3 py-2">
                        {getNodeLabel(elements, edge.target, pageName)}{" "}
                        {edge.data?.condition ? `(${edge.data.condition})` : ""}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400">No outgoing connections</div>
                  )}
                </div>
              </div>
            </div>
          </PanelSection>
        </div>
      )}

      {selectedEdge && (
        <div className="space-y-5">
          <PanelSection title="Selected condition">
            <TextField
              label="Condition label"
              value={selectedEdge.data?.condition || ""}
              onChange={condition => updateEdge(selectedEdge.id, condition)}
              placeholder="Yes, No, Complete..."
            />
          </PanelSection>

          <PanelSection title="Connected nodes">
            <div className="space-y-3 text-sm text-slate-700">
              <DetailRow
                label="From"
                value={getNodeLabel(elements, selectedEdge.source, pageName)}
              />
              <DetailRow
                label="To"
                value={getNodeLabel(elements, selectedEdge.target, pageName)}
              />
            </div>
          </PanelSection>
        </div>
      )}
    </div>
  );
}
