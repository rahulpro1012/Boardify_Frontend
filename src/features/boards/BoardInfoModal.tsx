import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  deleteBoard,
  addBoardMember, // [NEW] Use specific action
  removeBoardMember, // [NEW] Use specific action
} from "./boardsSlice";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../../components/UserAvatar";

interface Props {
  board: {
    id: number;
    name: string;
    members?: string[];
    createdBy?: string;
  };
  onClose: () => void;
}

export default function BoardInfoModal({ board, onClose }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const currentUser = useAppSelector((s) => s.auth.user);

  // 1. Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    const currentMembers = board.members || [];
    if (currentMembers.includes(newMemberEmail)) {
      alert("User is already a member!");
      return;
    }

    // FIX: Dispatch the specific 'addBoardMember' action
    await dispatch(
      addBoardMember({
        boardId: board.id,
        email: newMemberEmail,
      })
    );

    setNewMemberEmail("");
    setIsAdding(false);
  };

  // 2. Handle Remove Member
  const handleRemoveMember = async (emailToRemove: string) => {
    if (!confirm(`Remove ${emailToRemove} from this board?`)) return;

    // FIX: Dispatch the specific 'removeBoardMember' action
    await dispatch(
      removeBoardMember({
        boardId: board.id,
        email: emailToRemove,
      })
    );
  };

  const handleDeleteBoard = async () => {
    if (
      confirm(
        "Are you sure? This will delete the board and all its tasks permanently."
      )
    ) {
      await dispatch(deleteBoard(board.id));
      onClose();
      navigate("/");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800">Board Settings</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        <div className="p-6">
          {/* Section: Board Members */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Members
              </h4>
              {!isAdding && (
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                >
                  + Add Member
                </button>
              )}
            </div>

            {/* Add Member Form */}
            {isAdding && (
              <form
                onSubmit={handleAddMember}
                className="mb-4 flex gap-2 animate-in slide-in-from-top-2"
              >
                <input
                  autoFocus
                  type="email"
                  placeholder="Enter email address..."
                  className="flex-1 px-3 py-1.5 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-100"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                />
                <button
                  type="submit"
                  className="bg-blue-600 text-white text-xs font-bold px-3 rounded hover:bg-blue-700"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-gray-400 hover:text-gray-600 px-1"
                >
                  ✕
                </button>
              </form>
            )}

            {/* Members List */}
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {(board.members || []).map((memberEmail) => (
                <div
                  key={memberEmail}
                  className="flex items-center justify-between group p-2 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar email={memberEmail} size="md" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-700">
                        {memberEmail}
                      </span>
                      {memberEmail === currentUser?.email && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          It's you
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveMember(memberEmail)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                    title="Remove member"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {(board.members || []).length === 0 && (
                <p className="text-sm text-gray-400 italic text-center py-2">
                  No members yet.
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-gray-100 my-4"></div>

          {/* Danger Zone */}
          <div>
            <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-2">
              Danger Zone
            </h4>
            <button
              onClick={handleDeleteBoard}
              className="w-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 font-medium py-2 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
      </div>
    </div>
  );
}
