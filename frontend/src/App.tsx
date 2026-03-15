import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useEffect, useState } from "react";
import { TopHeader } from "./components/TopHeader";
import { CreatePostModal } from "./components/CreatePostModal";
import { ProfileSetupModal } from "./components/ProfileSetupModal";
import { UserProfilePage } from "./components/UserProfilePage";
import { PublicUserProfile } from "./components/PublicUserProfile";
import { MainContent } from "./components/MainContent";
import {
  useGetUserProfile,
  useGetAllPosts,
  useGetFollowingFeed,
  useGetUserPrincipalByUsername,
} from "./hooks/useQueries";
import { useMultipleSorting } from "./hooks/useSorting";
import { useAppState } from "./hooks/useAppState";
import { Principal } from "@dfinity/principal";

// Component to handle username to Principal conversion for public profiles
function PublicProfileWrapper({ username }: { username: string }) {
  const {
    data: userPrincipal,
    isLoading,
    error,
  } = useGetUserPrincipalByUsername(username);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full border-b-2 h-8 w-8 border-indigo-500" />
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  if (error || !userPrincipal) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">User not found</p>
      </div>
    );
  }

  return <PublicUserProfile userPrincipal={userPrincipal} />;
}

// Component to handle profile viewing via Principal string
function PublicProfileByPrincipal({
  principalString,
}: {
  principalString: string;
}) {
  try {
    const userPrincipal = Principal.fromText(principalString);
    return <PublicUserProfile userPrincipal={userPrincipal} />;
  } catch (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Invalid user profile</p>
      </div>
    );
  }
}

export default function App() {
  const { identity } = useInternetIdentity();
  const { state, handlers } = useAppState();

  const {
    data: userProfile,
    isLoading: profileLoading,
    error: profileError,
  } = useGetUserProfile();
  const { data: posts = [], isLoading: postsLoading } = useGetAllPosts();
  const { data: followingPosts = [], isLoading: followingLoading } =
    useGetFollowingFeed();

  const isAuthenticated = !!identity;
  const [allowProfileModal, setAllowProfileModal] = useState(false);

  // Add a small delay before allowing profile setup modal to prevent flash on refresh
  useEffect(() => {
    if (isAuthenticated) {
      const timer = setTimeout(() => {
        setAllowProfileModal(true);
      }, 500); // 500ms delay to allow profile to load
      return () => clearTimeout(timer);
    } else {
      setAllowProfileModal(false);
    }
  }, [isAuthenticated]);

  // Only show profile setup modal if user is authenticated, profile has finished loading,
  // no profile exists, not in an error state, and delay has passed
  const needsProfile =
    isAuthenticated &&
    allowProfileModal &&
    !profileLoading &&
    !userProfile &&
    !profileError;

  // Reset profile check when authentication changes
  useEffect(() => {
    if (!isAuthenticated) {
      // User logged out, reset any profile-related state
      handlers.updateState({
        showProfile: false,
        viewingUserProfile: null,
        viewingUserPrincipal: null,
      });
    }
  }, [isAuthenticated, handlers]);

  // Sort all post collections efficiently
  const sortedPostGroups = useMultipleSorting(
    {
      community: posts,
      following: followingPosts,
    },
    state.sortBy,
  );

  // Determine which posts and loading state to display
  const { displayPosts, displayLoading } = (() => {
    if (state.currentFeedTab === "community") {
      return {
        displayPosts: sortedPostGroups.community,
        displayLoading: postsLoading,
      };
    }
    return {
      displayPosts: sortedPostGroups.following,
      displayLoading: followingLoading,
    };
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(99,102,241,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Header */}
        <TopHeader
          onHomeNavigation={handlers.handleHomeNavigation}
          onShowProfile={handlers.toggleProfile}
          onViewProfile={handlers.handleViewProfile}
        />

        {/* Main Content */}
        <main className="flex-1 py-8 px-4 lg:px-8">
          {state.showProfile ? (
            <UserProfilePage />
          ) : state.viewingUserPrincipal ? (
            <PublicProfileByPrincipal
              principalString={state.viewingUserPrincipal}
            />
          ) : state.viewingUserProfile ? (
            <PublicProfileWrapper username={state.viewingUserProfile} />
          ) : (
            <MainContent
              posts={displayPosts}
              postsLoading={displayLoading}
              onCreatePost={handlers.toggleCreatePost}
              currentFeedTab={state.currentFeedTab}
              onFeedTabChange={handlers.setCurrentFeedTab}
              onViewProfile={handlers.handleViewProfile}
              sortBy={state.sortBy}
              onSortChange={handlers.setSortBy}
            />
          )}
        </main>

        {/* Footer - positioned at bottom */}
        <footer className="p-6 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <span>© 2025. Built with</span>
            <span className="text-red-500 animate-pulse">♥</span>
            <span>using</span>
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gradient-aurora font-semibold hover:underline transition-all duration-300"
            >
              caffeine.ai
            </a>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {state.showCreatePost && (
        <CreatePostModal onClose={handlers.toggleCreatePost} />
      )}

      {needsProfile && <ProfileSetupModal />}
    </div>
  );
}
