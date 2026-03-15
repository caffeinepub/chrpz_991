import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  User,
  UserPlus,
  UserCheck,
  Calendar,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import { useState } from "react";
import { PostCard } from "./PostCard";
import {
  useGetUserProfileWithStats,
  useGetAllPosts,
  useFollowUser,
  useUnfollowUser,
} from "../hooks/useQueries";
import { formatDistanceToNow } from "../utils/dateUtils";
import { Principal } from "@dfinity/principal";
import { UserListModal } from "./UserListModal";
import { UserAvatar } from "./UserAvatar";
import { useProfilePicture } from "../hooks/useProfilePicture";

interface PublicUserProfileProps {
  userPrincipal: Principal;
}

export function PublicUserProfile({ userPrincipal }: PublicUserProfileProps) {
  const { identity } = useInternetIdentity();
  const { data: profileStats } = useGetUserProfileWithStats(userPrincipal);
  const { data: allPosts = [] } = useGetAllPosts();
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const profilePictureUrl = useProfilePicture(userPrincipal);

  const isAuthenticated = !!identity;
  const isOwnProfile =
    isAuthenticated &&
    userPrincipal.toString() === identity?.getPrincipal().toString();

  // Filter posts by this user
  const userPosts = allPosts
    .filter((post) => post.author.toString() === userPrincipal.toString())
    .sort((a, b) => Number(b.timestamp - a.timestamp)); // Sort by newest first

  const totalLikes = userPosts.reduce(
    (sum, post) => sum + post.likedBy.length,
    0,
  );

  const handleFollowToggle = async () => {
    if (!isAuthenticated || isOwnProfile) return;

    try {
      if (profileStats?.isFollowedByCurrentUser) {
        await unfollowMutation.mutateAsync(userPrincipal);
      } else {
        await followMutation.mutateAsync(userPrincipal);
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  if (!profileStats) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          User not found
        </h3>
        <p className="text-gray-500 mb-6">
          This user doesn't exist or hasn't set up their profile yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-gray-200/50">
        <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Profile Picture */}
          <div className="shrink-0 mx-auto md:mx-0">
            <UserAvatar
              src={profilePictureUrl}
              alt={`${profileStats.displayName}'s profile`}
              size="xl"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  {profileStats.displayName}
                </h1>
                <p className="text-gray-500 text-sm mb-2">
                  @{profileStats.username}
                </p>
                {profileStats.bio && (
                  <p className="text-gray-600 text-lg mb-4">
                    {profileStats.bio}
                  </p>
                )}
              </div>

              {/* Follow Button */}
              {isAuthenticated && !isOwnProfile && (
                <button
                  onClick={handleFollowToggle}
                  disabled={
                    followMutation.isPending || unfollowMutation.isPending
                  }
                  className={`inline-flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${
                    profileStats.isFollowedByCurrentUser
                      ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  } disabled:opacity-50`}
                >
                  {followMutation.isPending || unfollowMutation.isPending ? (
                    <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-current" />
                  ) : profileStats.isFollowedByCurrentUser ? (
                    <UserCheck className="w-4 h-4" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>
                    {profileStats.isFollowedByCurrentUser
                      ? "Following"
                      : "Follow"}
                  </span>
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-indigo-600">
                  {profileStats.postsCount}
                </div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {totalLikes}
                </div>
                <div className="text-sm text-gray-500">Total Likes</div>
              </div>
              <button
                onClick={() => setShowFollowers(true)}
                className="hover:scale-105 transition-transform"
              >
                <div className="text-2xl font-bold text-purple-600">
                  {profileStats.followersCount}
                </div>
                <div className="text-sm text-gray-500">Followers</div>
              </button>
              <button
                onClick={() => setShowFollowing(true)}
                className="hover:scale-105 transition-transform"
              >
                <div className="text-2xl font-bold text-blue-600">
                  {profileStats.followingCount}
                </div>
                <div className="text-sm text-gray-500">Following</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {isOwnProfile ? "Your Posts" : `${profileStats.name}'s Posts`}
          </h2>
          <div className="text-sm text-gray-500">
            {userPosts.length} post{userPosts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {userPosts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isOwnProfile
                ? "You haven't posted anything yet"
                : `${profileStats.name} hasn't posted anything yet`}
            </h3>
            <p className="text-gray-500">
              {isOwnProfile
                ? "Share your first thought with the community!"
                : "Check back later for new posts."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {userPosts.map((post) => (
              <PostCard key={post.id.toString()} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <UserListModal
          userPrincipal={userPrincipal}
          type="followers"
          onClose={() => setShowFollowers(false)}
          onViewProfile={(principal) => {
            setShowFollowers(false);
            // Navigate to the new profile - this would be handled by the parent component
          }}
        />
      )}

      {/* Following Modal */}
      {showFollowing && (
        <UserListModal
          userPrincipal={userPrincipal}
          type="following"
          onClose={() => setShowFollowing(false)}
          onViewProfile={(principal) => {
            setShowFollowing(false);
            // Navigate to the new profile - this would be handled by the parent component
          }}
        />
      )}
    </div>
  );
}
