import deleteIcon from "../assets/delete-bin-6-line.svg";

export default function DeleteButton({
  onClick,
  className = "",
  title = "Delete"
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`inline-flex items-center justify-center text-red-500 hover:text-red-700 ${className}`}
    >
      <img src={deleteIcon} alt="" className="h-4 w-4" />
    </button>
  );
}
