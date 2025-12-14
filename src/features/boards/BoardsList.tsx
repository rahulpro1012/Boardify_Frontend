import { useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchBoards } from "./boardsSlice";
// Import the typed hooks we defined above
import { useAppDispatch, useAppSelector } from "../../app/hooks";

export default function BoardsList() {
  // 1. Use typed dispatch (Fixes the 'as any' error)
  const dispatch = useAppDispatch();

  // 2. Destructure all state variables (assuming your slice has an 'error' field)
  const {
    items: boards,
    loading,
    error,
  } = useAppSelector((state) => state.boards);

  useEffect(() => {
    // No casting needed anymore! TypeScript knows this is a Thunk.
    dispatch(fetchBoards());
  }, [dispatch]);

  // 3. Enhancement: Better Loading State (Tailwind Spinner)
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 4. Enhancement: Error State
  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded border border-red-200">
        Error loading boards: {error}
      </div>
    );
  }

  // 5. Enhancement: Empty State (UX Best Practice)
  if (!boards || boards.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>No boards found.</p>
        <Link to="/boards/new" className="text-blue-500 hover:underline">
          Create your first board?
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {boards.map((b) => (
        <Link
          to={`/boards/${b.id}`}
          key={b.id}
          className="block p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="font-semibold text-lg text-gray-800 mb-2">
            {b.name}
          </div>
          {/* Optional: Add description or metadata if available */}
          <div className="text-sm text-gray-500">Board #{b.id}</div>
        </Link>
      ))}
    </div>
  );
}
