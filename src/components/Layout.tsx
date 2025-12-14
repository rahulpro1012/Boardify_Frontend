import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth"; // Assuming path

export default function Layout() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 h-14 flex items-center justify-between shadow-sm">
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
        <div>
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Page Content */}
      <main className="p-4 h-[calc(100vh-3.5rem)]">
        <Outlet />
      </main>
    </div>
  );
}
