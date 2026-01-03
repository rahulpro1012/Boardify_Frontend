import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { useAppDispatch, useAppSelector } from "../app/hooks"; // [NEW]
import { fetchCurrentUser } from "../features/auth/authSlice"; // [NEW]
import UserAvatar from "./UserAvatar"; // [NEW]
import ProfileModal from "../features/auth/ProfileModal"; // [NEW]
import { Toaster } from "react-hot-toast";

export default function Layout() {
  const { logout } = useAuth();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((s) => s.auth.user); // [NEW] Get user from Redux
  const [showProfile, setShowProfile] = useState(false); // [NEW] Modal state

  // [NEW] Fetch user profile once when the app loads
  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return (
    <div className="flex flex-col h-screen bg-gray-50 text-slate-900">
      <Toaster
        position="top-center"
        toastOptions={{ duration: 3000 }}
        reverseOrder={false}
      />
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0 h-14 px-4 flex items-center justify-between shadow-sm z-50 relative">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="font-bold text-xl text-blue-600 flex items-center gap-2"
          >
            <span>Boardify</span>
          </Link>
          <nav className="text-sm font-medium text-gray-600 space-x-4">
            <Link to="/" className="hover:text-blue-600 transition-colors">
              Boards
            </Link>
          </nav>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Logout
          </button>

          {/* [NEW] Divider */}
          <div className="h-6 w-px bg-gray-200"></div>

          {/* [NEW] Profile Avatar Button */}
          <button
            onClick={() => setShowProfile(true)}
            className="rounded-full hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 transition-all"
            title="View Profile"
          >
            <UserAvatar
              email={currentUser?.email}
              username={currentUser?.username}
              size="md"
            />
          </button>
        </div>
      </header>

      {/* Page Content */}
      {/* Removed 'p-4' so BoardView can use full width. 
          Add 'p-4' inside your Dashboard component instead! */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>

      {/* [NEW] Profile Modal */}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
