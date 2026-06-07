function FieldHint({ children }) {
  return <p className="mt-2 text-xs leading-5 text-slate-500">{children}</p>;
}

export default function FormElements({ element }) {
  const baseClassName =
    "w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700";
  const commonProps = {
    required: element.required,
    readOnly: element.readOnly
  };

  switch (element.type) {
    case "input":
      return (
        <div>
          <input
            className={baseClassName}
            placeholder={element.placeholder || "Enter response"}
            {...commonProps}
          />
          {element.description && <FieldHint>{element.description}</FieldHint>}
        </div>
      );

    case "textarea":
      return (
        <div>
          <textarea
            className={`${baseClassName} min-h-28 resize-none`}
            placeholder={element.placeholder || "Enter detailed response"}
            {...commonProps}
          />
          {element.description && <FieldHint>{element.description}</FieldHint>}
        </div>
      );

    case "select":
      return (
        <div>
          <select className={baseClassName} required={element.required}>
            <option value="">
              {element.placeholder || "Select an option"}
            </option>
            {element.options?.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {element.description && <FieldHint>{element.description}</FieldHint>}
        </div>
      );

    case "radio":
      return (
        <div className="space-y-3">
          {(element.options || []).map(option => (
            <label
              key={option}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="radio"
                name={element.id}
                required={element.required}
                readOnly={element.readOnly}
              />
              <span>{option}</span>
            </label>
          ))}
          {element.description && <FieldHint>{element.description}</FieldHint>}
        </div>
      );

    case "date":
      return (
        <div>
          <input
            type="date"
            className={baseClassName}
            aria-label={element.placeholder || element.label || "Select date"}
            {...commonProps}
          />
          {element.description && <FieldHint>{element.description}</FieldHint>}
        </div>
      );

    case "phone":
      return (
        <div>
          <input
            type="tel"
            className={baseClassName}
            placeholder={element.placeholder || "Enter phone number"}
            {...commonProps}
          />
          {element.description && <FieldHint>{element.description}</FieldHint>}
        </div>
      );

    case "yesno":
      return (
        <div>
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(element.options?.length ? element.options : ["Yes", "No"]).map(option => (
              <button
                key={option}
                type="button"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition first:bg-emerald-600 first:text-white"
                disabled={element.readOnly}
              >
                {option}
              </button>
            ))}
          </div>
          {element.description && <FieldHint>{element.description}</FieldHint>}
        </div>
      );

    default:
      return null;
  }
}
