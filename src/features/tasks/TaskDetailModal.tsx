import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchComments, createComment } from "../comments/commentsSlice";
import { updateTask, type TaskDto } from "./tasksSlice";

interface Props {
  task: TaskDto;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: Props) {
  const dispatch = useAppDispatch();
  const comments = useAppSelector((s) => s.comments.byTask[task.id] || []);

  // Local state for editing
  const [description, setDescription] = useState(task.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newComment, setNewComment] = useState("");

  // Load comments when modal opens
  useEffect(() => {
    dispatch(fetchComments(task.id));
  }, [dispatch, task.id]);

  const handleSaveDescription = async () => {
    if (description !== task.description) {
      await dispatch(updateTask({ taskId: task.id, data: { description } }));
    }
    setIsEditingDesc(false);
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await dispatch(createComment({ taskId: task.id, content: newComment }));
    setNewComment("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{task.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              in list <span className="font-medium underline">Task List</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-8 h-8"
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

        <div className="flex-1 overflow-y-auto p-8 flex gap-8">
          {/* LEFT COLUMN: Description & Activity */}
          <div className="flex-1 space-y-8">
            {/* Description Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h7"
                  />
                </svg>
                <h3 className="font-semibold text-gray-800 text-lg">
                  Description
                </h3>
              </div>

              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full p-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none min-h-[120px] text-gray-700 leading-relaxed"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    autoFocus
                    placeholder="Add a more detailed description..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className={`p-4 rounded-lg cursor-pointer hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all min-h-[80px] ${
                    description
                      ? "text-gray-700"
                      : "text-gray-400 italic bg-gray-50/50"
                  }`}
                >
                  {description || "Add a more detailed description..."}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <h3 className="font-semibold text-gray-800 text-lg">
                  Activity
                </h3>
              </div>

              {/* Add Comment Input */}
              <div className="flex gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                  YO
                </div>
                <div className="flex-1">
                  <form onSubmit={handleSendComment} className="relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm transition-all pr-12"
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      className="absolute right-2 top-2 p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white rounded text-gray-500 transition-colors disabled:opacity-50"
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
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs shrink-0 mt-1">
                      {comment.authorEmail?.[0].toUpperCase() || "?"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">
                          {comment.authorEmail}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-gray-200 rounded-lg rounded-tl-none mt-1 shadow-sm text-gray-700 text-sm">
                        {comment.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sidebar (Assignees, etc.) */}
          <div className="w-48 space-y-4 pt-2">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Add to card
            </div>

            {/* Assignee Placeholder */}
            <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors text-left">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              Members
            </button>

            <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors text-left">
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Labels
            </button>

            {/* Delete Task Button */}
            <div className="mt-8 border-t pt-4 border-gray-100">
              <button className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm transition-colors">
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
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
