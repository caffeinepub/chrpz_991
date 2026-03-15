import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { User, Calendar, Edit, MapPin, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { PostCard } from "./PostCard";
import { UserProfileModal } from "./UserProfileModal";
import {
  useGetUserProfile,
  useGetAllPosts,
  useGetUserProfileWithStats as useGetUserProfileStats,
} from "../hooks/useQueries";
import { Principal } from "@dfinity/principal";
import { formatDistanceToNow } from "../utils/dateUtils";
import { UserListModal } from "./UserListModal";
import { UserAvatar } from "./UserAvatar";
import { useProfilePicture } from "../hooks/useProfilePicture";

export function UserProfilePage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetUserProfile();
  const { data: allPosts = [] } = useGetAllPosts();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const userPrincipal = identity?.getPrincipal();
  const profilePictureUrl = useProfilePicture(userPrincipal);

  const isAuthenticated = !!identity;
  const currentUserPrincipal = isAuthenticated
    ? identity.getPrincipal()
    : Principal.fromText("2vxsx-fae"); // Anonymous principal

  // Get profile stats for follower/following counts
  const { data: profileStats } = useGetUserProfileStats(currentUserPrincipal);

  // Filter posts by current user
  const userPosts = allPosts
    .filter(
      (post) =>
        isAuthenticated &&
        post.author.toString() === identity?.getPrincipal().toString(),
    )
    .sort((a, b) => Number(b.timestamp - a.timestamp)); // Sort by newest first

  const totalLikes = userPosts.reduce(
    (sum, post) => sum + post.likedBy.length,
    0,
  );

  if (!isAuthenticated || !userProfile) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Profile not available
        </h3>
        <p className="text-gray-500 mb-6">
          Please log in to view your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-end mb-8">
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center space-x-2 bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-full transition-all"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Profile Header */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
          {/* Profile Picture */}
          <div className="relative">
            <UserAvatar src={profilePictureUrl} alt="Profile" size="xl" />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {userProfile.name || userProfile.username}
            </h1>
            {userProfile.username && (
              <p className="text-gray-500 text-sm mb-2">
                @{userProfile.username}
              </p>
            )}

            {userProfile.bio && (
              <p className="text-gray-600 mb-4 leading-relaxed">
                {userProfile.bio}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDistanceToNow(Date.now() * 1000000)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {userPosts.length}
                </div>
                <div className="text-sm text-gray-500">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {totalLikes}
                </div>
                <div className="text-sm text-gray-500">Total Likes</div>
              </div>
              {profileStats && (
                <>
                  <button
                    onClick={() => setShowFollowers(true)}
                    className="text-center hover:scale-105 transition-transform"
                  >
                    <div className="text-2xl font-bold text-purple-600">
                      {profileStats.followersCount.toString()}
                    </div>
                    <div className="text-sm text-gray-500">Followers</div>
                  </button>
                  <button
                    onClick={() => setShowFollowing(true)}
                    className="text-center hover:scale-105 transition-transform"
                  >
                    <div className="text-2xl font-bold text-blue-600">
                      {profileStats.followingCount.toString()}
                    </div>
                    <div className="text-sm text-gray-500">Following</div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Your Posts</h2>
          <span className="text-sm text-gray-500">
            {userPosts.length} posts
          </span>
        </div>

        {userPosts.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-gray-200/50 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start sharing your thoughts with the world!
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

      {/* Edit Profile Modal */}
      {showEditModal && (
        <UserProfileModal onClose={() => setShowEditModal(false)} />
      )}

      {/* Followers Modal */}
      {showFollowers && currentUserPrincipal && (
        <UserListModal
          userPrincipal={currentUserPrincipal}
          type="followers"
          onClose={() => setShowFollowers(false)}
          onViewProfile={(principal) => {
            // Handle navigation to another user's profile
            setShowFollowers(false);
          }}
        />
      )}

      {/* Following Modal */}
      {showFollowing && currentUserPrincipal && (
        <UserListModal
          userPrincipal={currentUserPrincipal}
          type="following"
          onClose={() => setShowFollowing(false)}
          onViewProfile={(principal) => {
            // Handle navigation to another user's profile
            setShowFollowing(false);
          }}
        />
      )}
    </div>
  );
}
