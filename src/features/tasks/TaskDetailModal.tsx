import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchComments, createComment } from "../comments/commentsSlice";
import { updateTask, deleteTask, type TaskDto } from "./tasksSlice";
import UserAvatar from "../../components/UserAvatar";
import { toast } from "react-hot-toast";

interface Props {
  task: TaskDto;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: Props) {
  const dispatch = useAppDispatch();
  const comments = useAppSelector((s) => s.comments.byTask[task.id] || []);
  const currentBoard = useAppSelector((s) => s.boards.currentBoard);
  const currentUser = useAppSelector((s) => s.auth.user);

  const allLists = useAppSelector((s) => s.lists.items);
  const currentList = allLists.find((l) => l.id === task.listId);
  const allMembers = currentBoard?.members || [];

  // --- LOCAL STATE ---
  // 1. Title Editing State [NEW]
  const [titleInput, setTitleInput] = useState(task.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // 2. Description Editing State
  const [description, setDescription] = useState(task.description || "");
  const [isEditingDesc, setIsEditingDesc] = useState(false);

  // 3. Comment/Assignee State
  const [newComment, setNewComment] = useState("");
  const [showAssigneeMenu, setShowAssigneeMenu] = useState(false);

  useEffect(() => {
    dispatch(fetchComments(task.id));
  }, [dispatch, task.id]);

  // --- HANDLERS ---

  // [NEW] Handle Title Rename
  const handleTitleSave = async () => {
    if (titleInput.trim() && titleInput !== task.title) {
      try {
        await dispatch(
          updateTask({
            taskId: task.id,
            data: {
              title: titleInput, // Update Title
              description: task.description,
              assignedTo: task.assignedTo,
            },
          })
        ).unwrap();
        toast.success("Title updated");
      } catch (err) {
        toast.error("Failed to update title");
        console.error(err);
        setTitleInput(task.title);
      }
    } else {
      // Revert if empty
      setTitleInput(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    if (description !== task.description) {
      await dispatch(
        updateTask({
          taskId: task.id,
          data: {
            title: task.title,
            description: description,
            assignedTo: task.assignedTo,
          },
        })
      );
      toast.success("Description saved"); // Nice little confirmation
    }
    setIsEditingDesc(false);
  };

  const handleAssignMember = async (email: string) => {
    try {
      await dispatch(
        updateTask({
          taskId: task.id,
          data: {
            assignedTo: email,
          },
        })
      ).unwrap();
      toast.success("Assignee updated");
      setShowAssigneeMenu(false);
    } catch (err) {
      toast.error("Failed to assign member");
      console.error(err);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await dispatch(
        createComment({ taskId: task.id, text: newComment })
      ).unwrap();
      toast.success("Comment added");
      setNewComment("");
    } catch (err) {
      toast.error("Failed to add comment");
      console.error(err);
    }
  };

  const handleDeleteTask = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await dispatch(deleteTask({ taskId: task.id, listId: task.listId }));
      toast.success("Task deleted");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[85vh] flex flex-col overflow-hidden animate-fade-in relative z-10">
        {/* --- HEADER --- */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50 shrink-0">
          <div className="w-full mr-8">
            {/* [NEW] Editable Title UI */}
            {isEditingTitle ? (
              <input
                autoFocus
                className="text-xl font-bold text-gray-800 w-full bg-white border-2 border-blue-500 rounded px-2 py-1 outline-none shadow-sm"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTitleSave();
                }}
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-bold text-gray-800 cursor-pointer hover:bg-gray-200 rounded px-2 -ml-2 py-1 transition-colors border border-transparent hover:border-gray-300 w-fit"
                title="Click to rename"
              >
                {task.title}
              </h2>
            )}

            <div className="flex items-center gap-2 mt-2 px-1">
              <span className="text-sm text-gray-500">
                in list{" "}
                <span className="font-semibold text-gray-700 underline decoration-gray-300 underline-offset-2">
                  {currentList?.name || "Unknown List"}
                </span>
              </span>

              {task.assignedTo && (
                <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-100 shadow-sm pl-1 ml-2">
                  <UserAvatar email={task.assignedTo} size="sm" />
                  <span className="text-xs font-semibold">
                    {task.assignedTo}
                  </span>
                </div>
              )}
            </div>
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

        <div className="flex-1 overflow-y-auto p-8 flex flex-col md:flex-row gap-8">
          {/* Left Column */}
          <div className="flex-1 space-y-8 min-w-0">
            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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
                    className="w-full p-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none min-h-[120px] text-gray-700 text-sm leading-relaxed shadow-sm"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    autoFocus
                    placeholder="Add a more detailed description..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveDescription}
                      className="px-4 py-1.5 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-4 py-1.5 text-gray-600 hover:bg-gray-100 rounded font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingDesc(true)}
                  className={`p-4 rounded-lg cursor-pointer hover:bg-gray-100 border border-transparent hover:border-gray-200 transition-all min-h-[80px] text-sm leading-relaxed ${
                    description
                      ? "text-gray-700"
                      : "text-gray-500 italic bg-gray-50"
                  }`}
                >
                  {description || "Add a more detailed description..."}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
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

              <div className="flex gap-3 mb-6">
                <UserAvatar
                  email={currentUser?.email}
                  size="md"
                  className="mt-1"
                />
                <form onSubmit={handleSendComment} className="relative flex-1">
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none pr-12 text-sm transition-all shadow-sm"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="absolute right-2 top-2 p-1.5 bg-gray-100 hover:bg-blue-600 hover:text-white rounded transition-colors disabled:opacity-50 text-gray-500"
                  >
                    <svg
                      className="w-4 h-4 rotate-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
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

              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-sm italic">
                    No activity yet.
                  </div>
                )}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <UserAvatar
                      email={comment.author}
                      size="md"
                      className="mt-1 shadow-sm"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">
                          {comment.author}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-gray-200 rounded-lg rounded-tl-none mt-1 shadow-sm text-sm text-gray-700 group-hover:border-blue-200 transition-colors">
                        {comment.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="w-full md:w-48 space-y-4 pt-2 shrink-0">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Add to card
            </div>

            <div className="relative">
              <button
                onClick={() => setShowAssigneeMenu(!showAssigneeMenu)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors text-left font-medium"
              >
                <svg
                  className="w-4 h-4 text-gray-500"
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

              {showAssigneeMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowAssigneeMenu(false)}
                  ></div>
                  <div className="absolute top-full mt-2 w-60 bg-white shadow-xl rounded-lg border border-gray-100 z-20 py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 right-0 sm:left-0">
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 mb-1">
                      Select Member
                    </div>
                    {allMembers.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-400 italic">
                        No members found
                      </div>
                    )}
                    {allMembers.map((email) => (
                      <button
                        key={email}
                        onClick={() => handleAssignMember(email)}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                      >
                        <UserAvatar email={email} size="sm" />
                        <span className="truncate flex-1 font-medium">
                          {email === currentUser?.email
                            ? `${email} (You)`
                            : email}
                        </span>
                        {task.assignedTo === email && (
                          <svg
                            className="w-4 h-4 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-700 transition-colors text-left font-medium">
              <svg
                className="w-4 h-4 text-gray-500"
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
            </button> */}

            <div className="mt-8 border-t pt-4 border-gray-100">
              <button
                onClick={handleDeleteTask}
                className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded text-sm transition-colors font-medium border border-transparent hover:border-red-200"
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
                Delete Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
