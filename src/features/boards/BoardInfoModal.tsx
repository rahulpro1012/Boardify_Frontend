import { useState } from "react";
import { useAppDispatch } from "../../app/hooks";
import {
  addBoardMember,
  removeBoardMember,
  deleteBoard,
  type BoardDto,
} from "./boardsSlice";
import { useNavigate } from "react-router-dom";

interface Props {
  board: BoardDto;
  onClose: () => void;
}

export default function BoardInfoModal({ board, onClose }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: State to toggle delete confirmation view
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsSubmitting(true);
    await dispatch(addBoardMember({ boardId: board.id, email: inviteEmail }));
    setIsSubmitting(false);
    setInviteEmail("");
  };

  const handleRemove = async (email: string) => {
    // We can keep a simple confirm for removing members, or assume it's safe enough
    if (confirm(`Remove ${email} from the board?`)) {
      await dispatch(removeBoardMember({ boardId: board.id, email }));
    }
  };

  const handleDeleteBoard = async () => {
    setIsSubmitting(true);
    await dispatch(deleteBoard(board.id));
    navigate("/"); // Redirect to dashboard
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">
            {isDeleteConfirmOpen ? "Delete Board?" : "Board Settings"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* --- CONFIRMATION VIEW --- */}
        {isDeleteConfirmOpen ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Are you sure?
            </h4>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently delete <strong>{board.name}</strong> and all
              of its lists and cards. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoard}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70"
              >
                {isSubmitting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        ) : (
          /* --- DEFAULT VIEW --- */
          <div className="p-6 space-y-8">
            {/* Members Section */}
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Manage Members
              </h4>

              <form onSubmit={handleInvite} className="flex gap-2 mb-4">
                <input
                  type="email"
                  placeholder="colleague@example.com"
                  required
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "..." : "Invite"}
                </button>
              </form>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {(!board.memberEmails || board.memberEmails.length === 0) && (
                  <p className="text-gray-400 text-sm italic text-center py-2">
                    No members yet.
                  </p>
                )}

                {board.memberEmails?.map((email) => (
                  <div
                    key={email}
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                        {email[0].toUpperCase()}
                      </div>
                      <span
                        className="text-sm text-gray-700 truncate max-w-[180px]"
                        title={email}
                      >
                        {email}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemove(email)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Danger Zone */}
            <div>
              <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-3">
                Danger Zone
              </h4>
              <button
                onClick={() => setIsDeleteConfirmOpen(true)}
                className="w-full py-2.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete this Board
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
