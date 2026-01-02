import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchLists, clearLists, createList } from "../lists/listsSlice";
import { fetchTasksForList, moveLocal, createTask } from "../tasks/tasksSlice";
import api from "../../api/apiClient";

// Import Modals and Board Slices
import TaskDetailModal from "../tasks/TaskDetailModal";
import { fetchBoardById, updateBoard, clearCurrentBoard } from "./boardsSlice";
import BoardInfoModal from "./BoardInfoModal";

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useAppDispatch();

  // Redux State
  const lists = useAppSelector((s) => s.lists.items);
  const tasksByList = useAppSelector((s) => s.tasks.byList);
  const { currentBoard } = useAppSelector((s) => s.boards);

  // --- LOCAL STATE ---
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const listInputRef = useRef<HTMLInputElement>(null);

  const [addingCardToListId, setAddingCardToListId] = useState<number | null>(
    null
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const taskInputRef = useRef<HTMLTextAreaElement>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // For Header (Renaming)
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return Object.values(tasksByList)
      .flat()
      .find((t) => t.id === selectedTaskId);
  }, [selectedTaskId, tasksByList]);

  // --- EFFECTS ---
  useEffect(() => {
    if (boardId) {
      dispatch(fetchBoardById(Number(boardId)));
      dispatch(fetchLists(Number(boardId)));
    }
    return () => {
      dispatch(clearLists());
      dispatch(clearCurrentBoard());
    };
  }, [boardId, dispatch]);

  useEffect(() => {
    if (currentBoard) {
      setTitleInput(currentBoard.name);
    }
  }, [currentBoard]);

  useEffect(() => {
    if (lists.length > 0)
      lists.forEach((l) => dispatch(fetchTasksForList(l.id)));
  }, [lists, dispatch]);

  useEffect(() => {
    if (isAddingList && listInputRef.current) listInputRef.current.focus();
  }, [isAddingList]);

  useEffect(() => {
    if (addingCardToListId !== null && taskInputRef.current) {
      taskInputRef.current.focus();
      taskInputRef.current.style.height = "auto";
    }
  }, [addingCardToListId]);

  // --- HANDLERS ---

  const handleRenameBoard = async () => {
    // Prevent empty names
    if (!titleInput.trim()) {
      setTitleInput(currentBoard?.name || "");
      setIsEditingTitle(false);
      return;
    }

    // Only update if changed
    if (currentBoard && titleInput.trim() !== currentBoard.name) {
      await dispatch(
        updateBoard({ boardId: currentBoard.id, name: titleInput })
      );
    }
    setIsEditingTitle(false);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !boardId) return;
    await dispatch(
      createList({ boardId: Number(boardId), name: newListTitle })
    );
    setNewListTitle("");
    setIsAddingList(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || addingCardToListId === null) return;
    await dispatch(
      createTask({ listId: addingCardToListId, title: newTaskTitle })
    );
    setNewTaskTitle("");
    taskInputRef.current?.focus();
  };

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    const taskId = Number(draggableId.replace("task-", ""));
    const fromListId = Number(source.droppableId.replace("list-", ""));
    const toListId = Number(destination.droppableId.replace("list-", ""));
    const targetIndex = destination.index;

    dispatch(
      moveLocal({ taskId, fromList: fromListId, toList: toListId, targetIndex })
    );
    try {
      await api.patch(`/api/tasks/${taskId}/move`, { toListId, targetIndex });
    } catch (err) {
      console.log(err);
      dispatch(fetchTasksForList(fromListId));
      if (fromListId !== toListId) dispatch(fetchTasksForList(toListId));
    }
  }

  if (!currentBoard)
    return (
      <div className="p-8 text-center text-gray-500">Loading Board...</div>
    );

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 12px; width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; border: 3px solid transparent; background-clip: content-box; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
      `}</style>

      {/* Main Container */}
      <div className="h-[calc(100vh-64px)] bg-slate-100 flex flex-col font-sans">
        {/* --- HEADER --- */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold shadow-blue-200 shadow-lg select-none">
              {currentBoard.name ? currentBoard.name[0].toUpperCase() : "B"}
            </div>

            {/* Title Section with Hover Pencil */}
            <div className="relative group flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  autoFocus
                  className="font-bold text-lg text-slate-800 border-b-2 border-blue-500 outline-none px-1 bg-transparent w-64"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleRenameBoard}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur(); // Forces onBlur to run
                    }
                  }}
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="font-bold text-lg text-slate-800 tracking-tight cursor-pointer px-1 py-1 rounded hover:bg-gray-100 transition-colors"
                  title="Click to rename"
                >
                  {currentBoard.name}
                </h2>
              )}

              {/* Pencil Icon (Shows on Group Hover) */}
              {!isEditingTitle && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all p-1 rounded-full hover:bg-blue-50"
                  title="Rename Board"
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
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Members Stack */}
            <div className="flex -space-x-2">
              {(currentBoard.memberEmails || []).slice(0, 4).map((email, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 cursor-default"
                  title={email}
                >
                  {email[0].toUpperCase()}
                </div>
              ))}
              {(currentBoard.memberEmails?.length || 0) > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                  +{currentBoard.memberEmails!.length - 4}
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <button
              onClick={() => setShowSettings(true)}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </button>

            <Link
              to="/"
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              ✕
            </Link>
          </div>
        </div>

        {/* Board Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <div className="h-full flex items-start gap-6 p-6 min-w-max">
            <DragDropContext onDragEnd={onDragEnd}>
              {lists.map((list) => (
                <Droppable droppableId={`list-${list.id}`} key={list.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`w-72 max-h-full flex flex-col rounded-xl transition-all duration-200 ${
                        snapshot.isDraggingOver
                          ? "bg-blue-50 ring-2 ring-blue-200"
                          : "bg-[#f1f2f4]"
                      } shadow-sm border border-gray-200/50`}
                    >
                      {/* List Header */}
                      <div className="p-4 pb-2 flex justify-between items-center shrink-0 group cursor-pointer">
                        <h3 className="font-semibold text-slate-700 text-sm truncate">
                          {list.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-full">
                            {(tasksByList[list.id] || []).length}
                          </span>
                        </div>
                      </div>

                      {/* Tasks Container */}
                      <div className="px-2 pb-2 flex-1 overflow-y-auto min-h-[10px] custom-scrollbar px-3">
                        {(tasksByList[list.id] ?? []).map((task, idx) => (
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
                                onClick={() => setSelectedTaskId(task.id)}
                                className={`mb-2.5 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 group transition-all cursor-pointer ${
                                  snapshot.isDragging
                                    ? "rotate-2 shadow-xl ring-2 ring-blue-500 z-50 opacity-90 scale-105"
                                    : ""
                                }`}
                              >
                                <div className="text-sm text-slate-700 font-medium leading-snug">
                                  {task.title}
                                </div>
                                {task.description && (
                                  <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                                    <svg
                                      className="w-3 h-3"
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
                                    Has description
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>

                      {/* Add Card Footer */}
                      <div className="p-3 pt-0 mt-1">
                        {addingCardToListId === list.id ? (
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
                                onClick={() => {
                                  setAddingCardToListId(null);
                                  setNewTaskTitle("");
                                }}
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
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                Add
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            onClick={() => setAddingCardToListId(list.id)}
                            className="w-full py-2 px-2 text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-md text-left text-sm flex items-center gap-2 transition-colors duration-200"
                          >
                            <span className="text-lg leading-none">+</span> Add
                            a card
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </DragDropContext>

            {/* Add List Column */}
            <div className="w-72 shrink-0">
              {!isAddingList ? (
                <button
                  onClick={() => setIsAddingList(true)}
                  className="w-full bg-white/50 hover:bg-white text-slate-600 font-medium p-3 rounded-xl border border-dashed border-slate-300 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm text-left flex items-center gap-2 transition-all duration-200"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add another list
                </button>
              ) : (
                <form
                  onSubmit={handleCreateList}
                  className="bg-[#f1f2f4] p-3 rounded-xl shadow-md border border-slate-200"
                >
                  <input
                    ref={listInputRef}
                    type="text"
                    placeholder="List title..."
                    className="w-full px-3 py-2 border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 text-sm mb-2"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onBlur={() => {
                      if (!newListTitle) setIsAddingList(false);
                    }}
                  />
                  <div className="flex gap-2 items-center">
                    <button
                      type="submit"
                      className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm font-medium shadow-sm"
                    >
                      Add List
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingList(false)}
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
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {showSettings && currentBoard && (
        <BoardInfoModal
          board={currentBoard}
          onClose={() => setShowSettings(false)}
        />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
}
