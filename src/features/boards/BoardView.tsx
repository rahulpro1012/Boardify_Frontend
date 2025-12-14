import { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

// 1. Import typed hooks (from previous step)
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { fetchLists, clearLists } from "../lists/listsSlice";
import { fetchTasksForList, moveLocal } from "../tasks/tasksSlice";
import api from "../../api/apiClient";

export default function BoardView() {
  // 2. Safe params handling
  const { boardId } = useParams<{ boardId: string }>();

  // 3. Use typed dispatch (No more 'as any')
  const dispatch = useAppDispatch();
  const lists = useAppSelector((s) => s.lists.items);
  const tasksByList = useAppSelector((s) => s.tasks.byList);

  useEffect(() => {
    if (boardId) {
      dispatch(fetchLists(Number(boardId)));
    }
    // Cleanup function: runs when component unmounts
    return () => {
      dispatch(clearLists());
    };
  }, [boardId, dispatch]);

  useEffect(() => {
    // Only fetch tasks when lists are actually loaded
    if (lists.length > 0) {
      lists.forEach((l) => dispatch(fetchTasksForList(l.id)));
    }
  }, [lists, dispatch]);

  async function onDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    const taskId = Number(draggableId.replace("task-", ""));
    const fromListId = Number(source.droppableId.replace("list-", ""));
    const toListId = Number(destination.droppableId.replace("list-", ""));
    const targetIndex = destination.index;

    // 4. Optimistic Update (Update UI immediately)
    dispatch(
      moveLocal({ taskId, fromList: fromListId, toList: toListId, targetIndex })
    );

    try {
      // 5. API Call in background
      await api.patch(`/api/tasks/${taskId}/move`, { toListId, targetIndex });
    } catch (err) {
      console.error("Move failed, reverting...", err);
      // Revert logic: Refetch both lists to ensure state matches server
      dispatch(fetchTasksForList(fromListId));
      if (fromListId !== toListId) {
        dispatch(fetchTasksForList(toListId));
      }
    }
  }

  if (!boardId) return <div className="p-4">Invalid Board ID</div>;

  return (
    <div className="p-4 h-full flex gap-4 overflow-x-auto items-start bg-blue-50 min-h-screen">
      <DragDropContext onDragEnd={onDragEnd}>
        {lists.map((list) => (
          <Droppable droppableId={`list-${list.id}`} key={list.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                // 6. Enhancement: Visual feedback when dragging over a list
                className={`w-80 rounded-lg p-3 flex-shrink-0 transition-colors ${
                  snapshot.isDraggingOver ? "bg-blue-200" : "bg-gray-100"
                }`}
              >
                <div className="font-bold text-gray-700 mb-3 flex justify-between">
                  {list.name}
                  <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {(tasksByList[list.id] || []).length}
                  </span>
                </div>

                <div className="flex flex-col gap-2 min-h-[50px]">
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
                          // 7. Enhancement: Rotate slightly when dragging for "tactile" feel
                          style={{
                            ...provided.draggableProps.style,
                          }}
                          className={`rounded p-3 shadow-sm border border-gray-200 group hover:ring-2 ring-blue-400 cursor-grab active:cursor-grabbing ${
                            snapshot.isDragging
                              ? "bg-white shadow-xl rotate-2 opacity-90 scale-105"
                              : "bg-white"
                          }`}
                        >
                          <div className="text-sm font-medium text-gray-800">
                            {task.title}
                          </div>
                          {/* Example: Show a tiny ID or tag */}
                          <div className="text-xs text-gray-400 mt-1">
                            Task #{task.id}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </DragDropContext>
    </div>
  );
}
