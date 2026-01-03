import { useState, useRef, useEffect } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { useAppDispatch } from "../../app/hooks";
import { type ListDto, updateList, deleteList } from "./listsSlice";
import { createTask, type TaskDto } from "../tasks/tasksSlice";
import ListDeleteModal from "./ListDeleteModal";
import UserAvatar from "../../components/UserAvatar";

interface Props {
  list: ListDto;
  tasks: TaskDto[];
  index: number;
  boardId: number;
  onTaskClick: (taskId: number) => void;
}

export default function ListColumn({
  list,
  tasks,
  index,
  boardId,
  onTaskClick,
}: Props) {
  const dispatch = useAppDispatch();

  // --- STATE ---
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleInput, setTitleInput] = useState(list.name);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const taskInputRef = useRef<HTMLTextAreaElement>(null);

  // --- HANDLERS ---
  const handleRename = async () => {
    if (!titleInput.trim()) {
      setTitleInput(list.name);
      setIsRenaming(false);
      return;
    }
    if (titleInput !== list.name) {
      await dispatch(
        updateList({ boardId, listId: list.id, name: titleInput })
      );
    }
    setIsRenaming(false);
  };

  const confirmDelete = async () => {
    await dispatch(deleteList({ boardId, listId: list.id }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await dispatch(createTask({ listId: list.id, title: newTaskTitle }));
    setNewTaskTitle("");
    taskInputRef.current?.focus();
  };

  useEffect(() => {
    if (isAddingCard && taskInputRef.current) taskInputRef.current.focus();
  }, [isAddingCard]);

  return (
    <>
      <Draggable draggableId={`list-${list.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`w-72 max-h-full flex flex-col rounded-xl transition-all duration-200 shrink-0 ${
              snapshot.isDragging
                ? "opacity-100 rotate-2 scale-105 z-50 shadow-2xl"
                : ""
            } bg-[#f1f2f4] shadow-sm border border-gray-200/50 h-fit max-h-[calc(100vh-140px)]`}
          >
            {/* --- LIST HEADER --- */}
            <div
              {...provided.dragHandleProps}
              className="p-3 flex justify-between items-start gap-2 shrink-0 group relative"
            >
              {isRenaming ? (
                <input
                  autoFocus
                  className="w-full px-2 py-1 text-sm font-bold text-slate-700 border-2 border-blue-500 rounded bg-white focus:outline-none shadow-sm"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                  }}
                />
              ) : (
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <h3
                    onClick={() => setIsRenaming(true)}
                    className="text-sm font-bold text-slate-700 truncate cursor-pointer py-1 px-2 rounded hover:bg-white/50 transition-colors border border-transparent hover:border-gray-200"
                  >
                    {list.name}
                  </h3>
                  <button
                    onClick={() => setIsRenaming(true)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-all p-1 rounded hover:bg-white"
                    title="Rename List"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
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
                      d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                    />
                  </svg>
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    ></div>
                    <div className="absolute right-0 top-8 w-44 bg-white shadow-xl rounded-lg border border-gray-100 z-20 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                      <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        List Actions
                      </div>
                      <button
                        onClick={() => {
                          setIsRenaming(true);
                          setShowMenu(false);
                        }}
                        className="text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 w-full flex items-center gap-2"
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
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>{" "}
                        Rename
                      </button>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowMenu(false);
                        }}
                        className="text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full flex items-center gap-2"
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
                        </svg>{" "}
                        Delete List
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* --- TASKS DROPPABLE --- */}
            <Droppable droppableId={`list-${list.id}`} type="TASK">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`px-2 pb-2 flex-1 overflow-y-auto min-h-[2px] custom-scrollbar mx-1 transition-colors rounded-md ${
                    snapshot.isDraggingOver ? "bg-blue-100/50" : ""
                  }`}
                >
                  {tasks.map((task, idx) => (
                    <Draggable
                      draggableId={`task-${task.id}`}
                      index={idx}
                      key={task.id}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{ ...provided.draggableProps.style }}
                          onClick={() => onTaskClick(task.id)}
                          className={`mb-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 group transition-all cursor-pointer flex flex-col gap-2 ${
                            snapshot.isDragging
                              ? "rotate-2 shadow-xl ring-2 ring-blue-500 z-50 opacity-90 scale-105"
                              : "hover:shadow-md"
                          }`}
                        >
                          {/* Task Title */}
                          <div className="text-sm text-slate-700 font-medium leading-snug break-words">
                            {task.title}
                          </div>

                          {/* Task Meta (Description & Assignee) */}
                          <div className="flex items-center justify-between min-h-[16px]">
                            {/* Left: Icons (Description) */}
                            <div className="flex items-center gap-2">
                              {task.description && (
                                <div
                                  className="text-slate-400"
                                  title="Has description"
                                >
                                  <svg
                                    className="w-3.5 h-3.5"
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
                                </div>
                              )}
                            </div>

                            {/* Right: Assignee Avatar - [NEW] */}
                            {task.assignedTo && (
                              <div title={`Assigned to ${task.assignedTo}`}>
                                <UserAvatar
                                  email={task.assignedTo}
                                  size="sm"
                                  className="border border-white shadow-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* --- ADD CARD FOOTER --- */}
            <div className="p-3 pt-1">
              {isAddingCard ? (
                <form
                  onSubmit={handleCreateTask}
                  className="bg-white p-2 rounded-lg shadow-sm border border-blue-200"
                >
                  <textarea
                    ref={taskInputRef}
                    className="w-full text-sm text-slate-700 placeholder-slate-400 focus:outline-none resize-none bg-transparent"
                    placeholder="Enter task title..."
                    rows={2}
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleCreateTask(e);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddingCard(false)}
                      className="text-slate-400 hover:text-slate-600"
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
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700 shadow-sm"
                    >
                      Add
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingCard(true)}
                  className="w-full py-1.5 px-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-md text-left text-sm flex items-center gap-2 transition-colors"
                >
                  <span className="text-lg leading-none">+</span> Add a card
                </button>
              )}
            </div>
          </div>
        )}
      </Draggable>

      {showDeleteModal && (
        <ListDeleteModal
          listName={list.name}
          onConfirm={confirmDelete}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
