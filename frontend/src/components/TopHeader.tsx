import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { LogIn, User, LogOut, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { UserAvatar } from "./UserAvatar";
import { useGetUserProfile } from "../hooks/useQueries";
import { useProfilePicture } from "../hooks/useProfilePicture";
import type { Principal } from "@dfinity/principal";

interface TopHeaderProps {
  onHomeNavigation?: () => void;
  onShowProfile?: () => void;
  onViewProfile?: (userPrincipal: Principal) => void;
}

export function TopHeader({
  onHomeNavigation,
  onShowProfile,
  onViewProfile,
}: TopHeaderProps) {
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { data: userProfile } = useGetUserProfile();
  const userPrincipal = identity?.getPrincipal();
  const userProfilePictureUrl = useProfilePicture(userPrincipal);

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === "logging-in";

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message === "User is already authenticated") {
        try {
          await clear();
          await new Promise((resolve) => setTimeout(resolve, 500));
          await login();
        } catch (retryError) {
          console.error("Retry login failed:", retryError);
          window.location.reload();
        }
      }
    }
  };

  const handleLogout = async () => {
    try {
      setShowUserDropdown(false);
      await clear();
      await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error("Logout error:", error);
      window.location.reload();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={onHomeNavigation}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 glass-card-elevated rounded-lg flex items-center justify-center gradient-cosmic">
                <div className="text-white font-bold text-lg leading-none">
                  C
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gradient-aurora">
                  Chrpz
                </h1>
              </div>
            </button>

            {/* Right Side */}
            <div className="flex items-center space-x-3">
              {!isAuthenticated ? (
                /* Login Button */
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl transition-all hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none"
                >
                  {isLoggingIn ? (
                    <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-white" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">
                    {isLoggingIn ? "Connecting..." : "Login"}
                  </span>
                </button>
              ) : (
                /* Authenticated User Controls */
                <>
                  {/* User Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowUserDropdown(!showUserDropdown)}
                      className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <UserAvatar
                        src={userProfilePictureUrl}
                        alt={
                          userProfile?.name || userProfile?.username || "User"
                        }
                        size="sm"
                      />
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="font-medium text-gray-800">
                            {userProfile?.name ||
                              userProfile?.username ||
                              "User"}
                          </p>
                          {userProfile?.username && (
                            <p className="text-sm text-gray-500">
                              @{userProfile.username}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            onShowProfile?.();
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-700">View Profile</span>
                        </button>

                        <div className="border-t border-gray-100 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-red-50 transition-colors text-red-600"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
