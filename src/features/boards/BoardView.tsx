import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import UserAvatar from "../../components/UserAvatar";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import toast from "react-hot-toast";
import {
  fetchLists,
  clearLists,
  createList,
  moveListLocal,
  reorderList,
} from "../lists/listsSlice";
import { fetchTasksForList, moveLocal } from "../tasks/tasksSlice";

import api from "../../api/apiClient";

import TaskDetailModal from "../tasks/TaskDetailModal";
import { fetchBoardById, updateBoard, clearCurrentBoard } from "./boardsSlice";
import BoardInfoModal from "./BoardInfoModal";
import ListColumn from "../lists/ListColumn";

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useAppDispatch();

  // Redux State
  const lists = useAppSelector((s) => s.lists.items);
  const tasksByList = useAppSelector((s) => s.tasks.byList);
  const { currentBoard } = useAppSelector((s) => s.boards);

  // Local State
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const listInputRef = useRef<HTMLInputElement>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
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
    if (currentBoard) setTitleInput(currentBoard.name);
  }, [currentBoard]);

  useEffect(() => {
    if (lists.length > 0)
      lists.forEach((l) => dispatch(fetchTasksForList(l.id)));
  }, [lists, dispatch]);

  useEffect(() => {
    if (isAddingList && listInputRef.current) listInputRef.current.focus();
  }, [isAddingList]);

  // --- HANDLERS ---
  const handleRenameBoard = async () => {
    if (currentBoard && titleInput.trim() && titleInput !== currentBoard.name) {
      try {
        await dispatch(
          updateBoard({ boardId: currentBoard.id, name: titleInput })
        ).unwrap();
        toast.success("Board renamed");
      } catch (err) {
        toast.error("Failed to rename board");
        console.error(err);
        setTitleInput(currentBoard.name);
      }
    }
    setIsEditingTitle(false);
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim() || !boardId) return;
    try {
      await dispatch(
        createList({ boardId: Number(boardId), name: newListTitle })
      ).unwrap();
      toast.success("List created");
      setNewListTitle("");
      setIsAddingList(false);
    } catch (err) {
      toast.error("Failed to create list");
      console.error(err);
    }
  };

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { source, destination, type, draggableId } = result;
    const boardIdNum = Number(boardId);

    if (type === "LIST") {
      if (source.index === destination.index) return;
      const listId = Number(draggableId.replace("list-", ""));
      dispatch(
        moveListLocal({ fromIndex: source.index, toIndex: destination.index })
      );
      dispatch(
        reorderList({
          boardId: boardIdNum,
          listId: listId,
          targetIndex: destination.index,
        })
      );
      return;
    }

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

      <div className="h-[calc(100vh-64px)] bg-slate-100 flex flex-col font-sans">
        {/* --- HEADER --- */}
        <div className="h-14 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold shadow-blue-200 shadow-lg select-none">
              {currentBoard.name ? currentBoard.name[0].toUpperCase() : "B"}
            </div>

            <div className="relative group flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  autoFocus
                  className="font-bold text-lg text-slate-800 border-b-2 border-blue-500 outline-none px-1 bg-transparent w-64"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleRenameBoard}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="font-bold text-lg text-slate-800 tracking-tight cursor-pointer px-1 py-1 rounded hover:bg-gray-100 transition-colors"
                >
                  {currentBoard.name}
                </h2>
              )}
              {!isEditingTitle && (
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all p-1 rounded-full hover:bg-blue-50"
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
            <div className="flex -space-x-2">
              {(currentBoard.members || []).slice(0, 4).map((email, i) => (
                <UserAvatar
                  key={i}
                  email={email}
                  size="md"
                  className="border-2 border-white cursor-default"
                />
              ))}
              {(currentBoard.members?.length || 0) > 4 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                  +{currentBoard.members!.length - 4}
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

            {/* [NEW] Profile Button */}

            <Link
              to="/"
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors ml-2"
            >
              ✕
            </Link>
          </div>
        </div>

        {/* --- CANVAS --- */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable
              droppableId="all-lists"
              direction="horizontal"
              type="LIST"
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="h-full flex items-start gap-6 p-6 min-w-max"
                >
                  {lists.map((list, index) => (
                    <ListColumn
                      key={list.id}
                      list={list}
                      tasks={tasksByList[list.id] || []}
                      index={index}
                      boardId={Number(boardId)}
                      onTaskClick={setSelectedTaskId}
                    />
                  ))}
                  {provided.placeholder}

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
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

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
