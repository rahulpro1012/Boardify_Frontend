import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "./authSlice";
import { useNavigate } from "react-router-dom";

interface Props {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Get the user data fetched from backend
  const user = useAppSelector((s) => s.auth.user);

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      dispatch(logout());
      navigate("/login"); // Redirect to login
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      {/* Invisible backdrop to close on click outside */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in relative z-10">
        {/* Decorative Header */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        {/* Profile Avatar */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2">
          <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
            <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-4xl font-bold text-blue-600 select-none">
              {user.username?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="pt-16 pb-6 px-6 text-center">
          <h2 className="text-xl font-bold text-gray-800">{user.username}</h2>
          <p className="text-sm text-gray-500 mb-6">{user.email}</p>

          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">
                Role
              </span>
              <span className="text-sm font-medium text-gray-700 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {user.role || "Member"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-400 uppercase">
                User ID
              </span>
              <span className="text-sm font-mono text-gray-600">
                #{user.id}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="mt-6 w-full py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors flex items-center justify-center gap-2"
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
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </button>
        </div>

        {/* Close "X" Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors"
        >
          <svg
            className="w-5 h-5"
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
    </div>
  );
}
