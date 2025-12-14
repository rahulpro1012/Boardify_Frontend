// App.tsx (Optional Global Wrapper)
import { Outlet } from "react-router-dom";
// import { Toaster } from "react-hot-toast"; // Example: Toast notifications

export default function App() {
  return (
    <>
      {/* <Toaster position="top-right" /> */}
      <Outlet />
    </>
  );
}
