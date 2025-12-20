import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchBoards, createBoard, clearBoardErrors } from "./boardsSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

export default function BoardsList() {
  const dispatch = useAppDispatch();

  // Local state for Modal visibility and Form input
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");

  // Get data from Redux
  const {
    items: boards,
    loading,
    error,
    createStatus,
  } = useAppSelector((state) => state.boards);

  // 1. Fetch boards when the component mounts
  useEffect(() => {
    dispatch(fetchBoards());
  }, [dispatch]);

  // 2. Listener: Automatically close modal when creation succeeds
  useEffect(() => {
    if (createStatus === "succeeded") {
      setIsModalOpen(false);
      setNewBoardName(""); // Reset the input
      dispatch(clearBoardErrors()); // Reset the status back to 'idle'
    }
  }, [createStatus, dispatch]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      dispatch(createBoard(newBoardName));
    }
  };

  // --- RENDER STATES ---

  // 1. Loading Skeleton (Optional: could be a fancy skeleton loader)
  if (loading && boards.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // 2. Error State
  if (error && boards.length === 0) {
    return (
      <div className="max-w-lg mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <h3 className="text-red-800 font-semibold mb-2">
          Something went wrong
        </h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => dispatch(fetchBoards())}
          className="text-blue-600 font-medium hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* --- Page Header --- */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </span>
          Your Workspaces
        </h1>

        {/* Only show the top "Create" button if boards already exist */}
        {boards.length > 0 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Board
          </button>
        )}
      </div>

      {/* --- Empty State (The UX Fix) --- */}
      {!loading && boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-300">
          <div className="bg-gray-50 p-6 rounded-full mb-6">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No boards found
          </h3>
          <p className="text-gray-500 mb-8 text-center max-w-sm">
            It looks like you haven't created any boards yet. Create your first
            workspace to get started.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-shadow shadow-lg shadow-blue-200"
          >
            Create your first board
          </button>
        </div>
      ) : (
        /* --- Grid Layout --- */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {/* Quick Create Card (First item in grid) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer"
          >
            <span className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-200 flex items-center justify-center mb-2 transition-colors">
              <svg
                className="w-4 h-4 text-gray-500 group-hover:text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </span>
            <span className="text-sm font-medium text-gray-500 group-hover:text-blue-700">
              Create New Board
            </span>
          </button>

          {/* Board Cards */}
          {boards.map((b) => (
            <Link
              to={`/boards/${b.id}`}
              key={b.id}
              className="group block bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100 hover:border-blue-100"
            >
              {/* Decorative Gradient Header */}
              <div className="h-3 bg-gradient-to-r from-blue-500 to-indigo-600 group-hover:h-4 transition-all"></div>

              <div className="p-5">
                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-600 transition-colors truncate">
                  {b.name}
                </h3>
                <div className="flex items-center text-xs text-gray-400 font-medium">
                  <span className="uppercase tracking-wider">
                    Board #{b.id}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* --- Create Modal Overlay --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm transition-opacity">
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                Create New Board
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Board Name
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Q4 Marketing Plan 🚀"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                />
              </div>

              {/* Error inside Modal */}
              {createStatus === "failed" && error && (
                <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newBoardName.trim() || createStatus === "loading"}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-200"
                >
                  {createStatus === "loading" ? "Creating..." : "Create Board"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
