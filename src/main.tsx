import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// import App from "./App"; // Refactored: Renaming this to 'RootLayout' is clearer
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { store } from "./app/store";

// Features
import Login from "./features/auth/Login";
import BoardView from "./features/boards/BoardView";
import BoardsList from "./features/boards/BoardsList";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout"; // Use the Layout component we built in the previous step

const router = createBrowserRouter([
  // 1. Public Route: Login stands alone (No Header/Sidebar)
  {
    path: "/login",
    element: <Login />,
  },

  // 2. Protected Routes: Wrapped in Layout (Header + Outlet)
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    // If user goes to non-existent child, error page shows inside layout
    errorElement: <div>Something went wrong!</div>,
    children: [
      {
        index: true, // This means path: "/"
        element: <BoardsList />,
      },
      {
        path: "boards/:boardId",
        element: <BoardView />,
      },
    ],
  },

  // 3. Fallback: Catch-all redirect
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);
