import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchLists, clearLists, createList } from "../lists/listsSlice";
// Import the new createTask thunk
import { fetchTasksForList, moveLocal, createTask } from "../tasks/tasksSlice";
import api from "../../api/apiClient";

export default function BoardView() {
  const { boardId } = useParams<{ boardId: string }>();
  const dispatch = useAppDispatch();

  const lists = useAppSelector((s) => s.lists.items);
  const tasksByList = useAppSelector((s) => s.tasks.byList);

  // --- STATE ---
  // For Lists
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const listInputRef = useRef<HTMLInputElement>(null);

  // For Tasks (NEW)
  // We store the ID of the list currently being edited (null = none)
  const [addingCardToListId, setAddingCardToListId] = useState<number | null>(
    null
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const taskInputRef = useRef<HTMLTextAreaElement>(null);

  // --- EFFECTS ---
  useEffect(() => {
    if (boardId) dispatch(fetchLists(Number(boardId)));
    return () => {
      dispatch(clearLists());
    };
  }, [boardId, dispatch]);

  useEffect(() => {
    if (lists.length > 0)
      lists.forEach((l) => dispatch(fetchTasksForList(l.id)));
  }, [lists, dispatch]);

  // Focus management
  useEffect(() => {
    if (isAddingList && listInputRef.current) listInputRef.current.focus();
  }, [isAddingList]);

  useEffect(() => {
    if (addingCardToListId !== null && taskInputRef.current) {
      taskInputRef.current.focus();
      taskInputRef.current.style.height = "auto"; // Reset height
    }
  }, [addingCardToListId]);

  // --- HANDLERS ---
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
    // We keep the form open so they can add another task immediately (UX Best Practice)
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
      dispatch(fetchTasksForList(fromListId));
      if (fromListId !== toListId) dispatch(fetchTasksForList(toListId));
    }
  }

  if (!boardId) return <div>Invalid Board</div>;

  return (
    <div className="h-[calc(100vh-64px)] bg-gradient-to-br from-blue-500 to-indigo-600 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-12 bg-black/10 backdrop-blur-sm flex items-center px-4 text-white justify-between shrink-0">
        <h2 className="font-bold text-lg">Board #{boardId}</h2>
        <Link
          to="/"
          className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Main Board Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="h-full flex items-start gap-4 p-4 min-w-max">
          <DragDropContext onDragEnd={onDragEnd}>
            {lists.map((list) => (
              <Droppable droppableId={`list-${list.id}`} key={list.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`w-72 max-h-full flex flex-col rounded-xl shadow-lg transition-colors ${
                      snapshot.isDraggingOver ? "bg-gray-200" : "bg-gray-100"
                    }`}
                  >
                    {/* List Header */}
                    <div className="p-3 font-semibold text-gray-700 flex justify-between items-center shrink-0">
                      {list.name}
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        {(tasksByList[list.id] || []).length}
                      </span>
                    </div>

                    {/* Tasks List */}
                    <div className="px-2 pb-2 flex-1 overflow-y-auto min-h-[10px] custom-scrollbar">
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
                              className={`mb-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 group ${
                                snapshot.isDragging
                                  ? "rotate-2 shadow-xl ring-2 ring-blue-500 z-50"
                                  : ""
                              }`}
                            >
                              <div className="text-sm text-gray-800 break-words">
                                {task.title}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {/* --- ADD CARD SECTION --- */}
                    <div className="p-2 pt-0">
                      {addingCardToListId === list.id ? (
                        <form onSubmit={handleCreateTask} className="mt-1">
                          <textarea
                            ref={taskInputRef}
                            className="w-full p-2 text-sm rounded-lg border-2 border-blue-500 focus:outline-none shadow-sm resize-none overflow-hidden"
                            placeholder="Enter a title for this card..."
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
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="submit"
                              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
                            >
                              Add Card
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingCardToListId(null);
                                setNewTaskTitle("");
                              }}
                              className="text-gray-500 hover:text-gray-700"
                            >
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setAddingCardToListId(list.id)}
                          className="w-full py-2 px-2 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded text-left text-sm flex items-center gap-2 transition-colors"
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
                          Add a card
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </DragDropContext>

          {/* Add List Button (Same as before) */}
          <div className="w-72 shrink-0">
            {!isAddingList ? (
              <button
                onClick={() => setIsAddingList(true)}
                className="w-full bg-white/20 hover:bg-white/30 text-white font-medium p-3 rounded-xl text-left flex items-center gap-2 transition-colors backdrop-blur-sm"
              >
                <span>+</span> Add another list
              </button>
            ) : (
              <form
                onSubmit={handleCreateList}
                className="bg-gray-100 p-2 rounded-xl shadow-lg"
              >
                <input
                  ref={listInputRef}
                  type="text"
                  placeholder="Enter list title..."
                  className="w-full px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onBlur={() => {
                    if (!newListTitle) setIsAddingList(false);
                  }}
                />
                <div className="flex gap-2 items-center">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm font-medium"
                  >
                    Add List
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingList(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
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
  );
}
