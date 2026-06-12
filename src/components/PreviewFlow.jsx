import { useEffect, useMemo, useState } from "react";
import {
  FaCalendarAlt,
  FaChevronRight,
  FaInfoCircle,
  FaPhoneAlt
} from "react-icons/fa";

const deviceFrames = {
  desktop: {
    width: "max-w-6xl",
    frame: "",
    screen: ""
  },
  tablet: {
    width: "max-w-[820px]",
    frame:
      "rounded-[2.4rem] border-[12px] border-slate-900 bg-slate-900 p-2 shadow-[0_26px_70px_rgba(15,23,42,0.28)]",
    screen:
      "h-[820px] max-h-[78vh] overflow-y-auto rounded-[1.55rem] bg-white px-6 py-6 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20"
  },
  mobile: {
    width: "max-w-[410px]",
    frame:
      "rounded-[2.8rem] border-[10px] border-slate-950 bg-slate-950 p-2 shadow-[0_26px_70px_rgba(15,23,42,0.32)]",
    screen:
      "h-[700px] max-h-[76vh] overflow-y-auto rounded-[2rem] bg-white px-4 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20"
  }
};

const fieldWidthClasses = {
  full: "col-span-12",
  half: "col-span-6",
  quarter: "col-span-3"
};

function getPreviewFields(elements) {
  return elements.filter(
    element => element.type !== "section" && element.type !== "condition"
  );
}

function getFieldTypeLabel(type) {
  if (type === "textarea") {
    return "Long answer";
  }

  if (type === "select") {
    return "Dropdown";
  }

  if (type === "radio") {
    return "Multiple choice";
  }

  if (type === "date") {
    return "Date";
  }

  if (type === "phone") {
    return "Phone";
  }

  if (type === "yesno") {
    return "Yes / No";
  }

  return "Text field";
}

function getPreviewFieldClassName(field, previewDevice) {
  if (previewDevice === "mobile") {
    return "col-span-12";
  }

  return fieldWidthClasses[field.fieldWidth] || fieldWidthClasses.full;
}

function renderField(field, value, handleAnswer) {
  const baseClassName =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100";

  if (field.readOnly) {
    return (
      <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
        Auto-generated
      </div>
    );
  }

  if (field.type === "radio") {
    return (
      <div className="flex flex-wrap gap-7">
        {(field.options || []).map(option => (
          <label
            key={option}
            className="inline-flex min-h-10 items-center gap-3 text-sm font-medium text-slate-700"
          >
            <input
              type="radio"
              name={field.id}
              checked={value === option}
              onChange={() => handleAnswer(field.id, option)}
              className="h-5 w-5 accent-emerald-600"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  if (field.type === "yesno") {
    return (
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {(field.options?.length ? field.options : ["Yes", "No"]).map(option => (
          <button
            key={option}
            type="button"
            onClick={() => handleAnswer(field.id, option)}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
              value === option
                ? "bg-gradient-to-br from-emerald-700 to-emerald-400 text-white shadow-sm"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <textarea
        value={value || ""}
        className={`${baseClassName} h-24 py-3`}
        placeholder={field.placeholder || "Enter detailed response"}
        onChange={event => handleAnswer(field.id, event.target.value)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={value || ""}
        className={baseClassName}
        onChange={event => handleAnswer(field.id, event.target.value)}
      >
        <option value="">{field.placeholder || "Select an option"}</option>
        {(field.options || []).map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  const isPhoneField = field.type === "phone" || /phone|mobile|contact/i.test(field.label || "");
  const isDateField = field.type === "date" || /date/i.test(field.label || "");

  return (
    <div className="relative">
      {isPhoneField && (
        <FaPhoneAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      {isDateField && (
        <FaCalendarAlt className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
      )}
      <input
        value={value || ""}
        type={isDateField ? "date" : "text"}
        className={`${baseClassName} ${isPhoneField || isDateField ? "pl-11" : ""}`}
        placeholder={field.placeholder || "Enter response"}
        onChange={event => handleAnswer(field.id, event.target.value)}
      />
    </div>
  );
}

export default function PreviewFlow({
  elements,
  edges,
  sections,
  formTitle,
  pageName,
  pages,
  activePageId,
  onSelectPage,
  previewDevice,
  showFieldNumbers,
  showLogicConditions,
  resetSignal
}) {
  const fields = useMemo(() => getPreviewFields(elements), [elements]);
  const activePageIndex = Math.max(
    0,
    pages.findIndex(page => page.id === activePageId)
  );
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      setFormData({});
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [resetSignal, activePageId]);

  function handleAnswer(id, value) {
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }));
  }

  function goToPage(offset) {
    const nextPage = pages[activePageIndex + offset];

    if (nextPage) {
      onSelectPage(nextPage.id);
    }
  }

  const groupedFields = {};

  fields.forEach(field => {
    const groupKey = field.sectionId || "ungrouped";

    if (!groupedFields[groupKey]) {
      groupedFields[groupKey] = [];
    }

    groupedFields[groupKey].push(field);
  });

  const fieldNumberMap = new Map(
    fields.map((field, index) => [field.id, `${activePageIndex + 1}.${index + 1}`])
  );
  const deviceFrame = deviceFrames[previewDevice] || deviceFrames.desktop;
  const isFramedDevice = previewDevice !== "desktop";

  return (
    <div className="h-full overflow-y-auto bg-white [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20">
      <div className="mx-auto flex min-h-full w-full flex-col px-7 py-3">
        <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-sky-50 px-5 py-4 text-sm font-semibold text-emerald-800">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-700 to-emerald-400 text-white">
              <FaInfoCircle className="text-xs" />
            </span>
            <span>
              This is a preview of how the form will appear to field users. Values
              entered here are not saved.
            </span>
          </div>
        </div>

        <div className="mt-10 border-b border-slate-200">
          <div className="grid grid-cols-5 gap-4 max-[1180px]:grid-cols-3 max-[760px]:grid-cols-1">
            {pages.map((page, index) => (
              <button
                key={page.id}
                type="button"
                onClick={() => onSelectPage(page.id)}
                className={`flex min-w-0 items-center gap-3 border-b-2 pb-5 text-left text-sm font-semibold transition ${
                  page.id === activePageId
                    ? "border-emerald-500 text-slate-950"
                    : "border-transparent text-slate-500 hover:text-emerald-700"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${
                    page.id === activePageId
                      ? "border-transparent bg-gradient-to-br from-emerald-700 to-emerald-400 text-white"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate">{page.name || `Page ${index + 1}`}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 text-right text-sm font-semibold text-slate-600">
          Page {activePageIndex + 1} of {pages.length}
        </div>

        <div className={`mx-auto mt-4 w-full ${deviceFrame.width} transition-all duration-300`}>
          <div className={deviceFrame.frame}>
            {isFramedDevice && (
              <div className="mx-auto mb-2 h-1.5 w-20 rounded-full bg-slate-700" />
            )}

            <div className={deviceFrame.screen}>
              <div className="px-5 py-0 max-[760px]:px-0">
                <h2 className="text-2xl font-bold text-slate-950">{pageName}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {formTitle}
                </p>
              </div>

              {fields.length === 0 ? (
                <div className="mt-6 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/60 px-6 py-16 text-center">
                  <h3 className="text-lg font-semibold text-slate-900">No preview fields yet</h3>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
                    Add fields in Design mode, then return to Preview to test how this
                    step will look for field users.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedFields).map(([sectionId, sectionFields]) => {
                    const section = sections.find(item => item.id === sectionId);

                    return (
                      <section key={sectionId} className="px-5 py-3 max-[760px]:px-0">
                        <div className="mb-7">
                          <h3 className="text-xl font-bold text-slate-950">
                            {section?.label || "General information"}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {section?.description || "Review and complete the fields in this step."}
                          </p>
                        </div>

                        <div className="grid grid-cols-12 gap-x-6 gap-y-8">
                          {sectionFields.map(field => (
                            <div
                              key={field.id}
                              className={getPreviewFieldClassName(field, previewDevice)}
                            >
                              <label className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                                {showFieldNumbers && (
                                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                                    {fieldNumberMap.get(field.id)}
                                  </span>
                                )}
                                <span>{field.label}</span>
                                {field.required && <span className="text-rose-500">*</span>}
                              </label>

                              {renderField(field, formData[field.id], handleAnswer)}

                              {field.description && (
                                <p className="mt-2 text-xs leading-5 text-slate-500">
                                  {field.description}
                                </p>
                              )}

                              {showLogicConditions && (
                                <LogicPreview
                                  field={field}
                                  fields={fields}
                                  edges={edges}
                                />
                              )}

                              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                {getFieldTypeLabel(field.type)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-slate-200 px-5 py-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              <strong className="text-slate-700">Preview Mode</strong>
              <span className="px-3">.</span>
              Navigate through steps to see the full form experience.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => goToPage(-1)}
                disabled={activePageIndex === 0}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => goToPage(1)}
                disabled={activePageIndex >= pages.length - 1}
                className="inline-flex h-11 items-center gap-3 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-400 px-6 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(16,131,85,0.22)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
                <FaChevronRight className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogicPreview({ field, fields, edges }) {
  const outgoingEdges = edges.filter(edge => edge.source === field.id);

  if (!outgoingEdges.length) {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-800">
      {outgoingEdges.map(edge => {
        const targetField = fields.find(item => item.id === edge.target);

        return (
          <div key={edge.id}>
            If value is <strong>{edge.data?.condition || edge.label || "matched"}</strong>,
            continue to <strong>{targetField?.label || "next field"}</strong>.
          </div>
        );
      })}
    </div>
  );
}
