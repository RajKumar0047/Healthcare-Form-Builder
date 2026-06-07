import {
  FaArrowsAltH,
  FaCheck,
  FaFileAlt,
  FaProjectDiagram,
  FaRandom,
  FaTimes
} from "react-icons/fa";

const legendItems = [
  {
    label: "Page / Section",
    icon: <span className="h-4 w-6 rounded border border-emerald-500 bg-emerald-50" />
  },
  {
    label: "Condition",
    icon: <span className="h-4 w-4 rotate-45 border border-amber-500 bg-amber-50" />
  },
  {
    label: "Yes path",
    icon: <span className="h-0 w-7 border-t-2 border-dashed border-emerald-500" />
  },
  {
    label: "No path",
    icon: <span className="h-0 w-7 border-t-2 border-dashed border-red-500" />
  },
  {
    label: "Next / flow",
    icon: <FaArrowsAltH className="text-slate-700" />
  }
];

export default function FlowOverviewPanel() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 pr-12 [scrollbar-width:thin] [scrollbar-color:rgba(75,130,108,0.35)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-emerald-900/20">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
          Flow overview
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">Logic map</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Visualize the form sequence, field dependencies, and page-level
          completion rules.
        </p>
      </div>

      <div className="mt-5 space-y-2">
        <button className="flex w-full items-center gap-3 rounded-xl bg-emerald-50 px-3 py-2.5 text-left text-sm font-semibold text-emerald-800">
          <FaProjectDiagram />
          All fields flow
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-emerald-50">
          <FaFileAlt />
          Pages / sections
        </button>
      </div>

      <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
          Add logic
        </p>
        <button
          type="button"
          className="mt-3 flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-white px-3 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <span className="flex h-10 w-10 rotate-45 items-center justify-center rounded-lg border border-amber-400 bg-amber-50 text-amber-600">
            <FaRandom className="-rotate-45" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900">
              Yellow + menu
            </span>
            <span className="block text-xs leading-5 text-slate-500">
              Use the plus button on pages or fields to choose page, node, or
              field conditions.
            </span>
          </span>
        </button>
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-slate-900">Legend</h3>
        <div className="mt-3 space-y-3">
          {legendItems.map(item => (
            <div key={item.label} className="flex items-center gap-3 text-sm text-slate-600">
              <span className="flex h-6 w-8 items-center justify-center">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-sm leading-6 text-emerald-800">
        <div className="flex items-center gap-2 font-semibold">
          <FaCheck />
          Filled required fields continue the page flow.
        </div>
        <div className="mt-2 flex items-center gap-2">
          <FaTimes />
          Missing required fields pause the next page.
        </div>
      </section>
    </div>
  );
}
