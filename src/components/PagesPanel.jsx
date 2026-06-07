import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import DeleteButton from "./DeleteButton";

function SortablePage({
  page,
  activePageId,
  setActivePageId,
  deletePage
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => setActivePageId(page.id)}
      className={`flex justify-between items-center p-3 mb-2 rounded cursor-pointer ${
        activePageId === page.id ? "bg-white shadow" : "hover:bg-green-100"
      }`}
    >
      <div className="flex items-center gap-2">
        <span {...attributes} {...listeners} className="cursor-grab">
          Drag
        </span>
        <span>{page.name}</span>
      </div>

      <DeleteButton
        onClick={(event) => {
          event.stopPropagation();
          deletePage(page.id);
        }}
        title="Delete page"
      />
    </div>
  );
}

export default function PagesPanel({
  pages,
  activePageId,
  setActivePageId,
  deletePage,
  addPage
}) {
  return (
    <div className="w-1/5 bg-green-200 p-4">
      <h2 className="font-bold mb-3">Pages</h2>

      <SortableContext
        items={pages.map(p => p.id)}
        strategy={verticalListSortingStrategy}
      >
        {pages.map(page => (
          <SortablePage
            key={page.id}
            page={page}
            activePageId={activePageId}
            setActivePageId={setActivePageId}
            deletePage={deletePage}
          />
        ))}
      </SortableContext>

      <button
        onClick={addPage}
        className="mt-3 w-full bg-green-600 text-white p-2 rounded"
      >
        + Add New Page
      </button>
    </div>
  );
}
