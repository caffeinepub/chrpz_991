import { useState, useEffect } from "react";
import { Principal } from "@dfinity/principal";
import { User, X, UserPlus, UserMinus } from "lucide-react";
import {
  useGetFollowersList,
  useGetFollowingList,
  useGetUserProfileWithStats,
  useFollowUser,
  useUnfollowUser,
} from "../hooks/useQueries";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { UserAvatar } from "./UserAvatar";
import { BaseModal } from "./BaseModal";
import { useProfilePicture } from "../hooks/useProfilePicture";

interface UserListModalProps {
  userPrincipal: Principal;
  type: "followers" | "following";
  onClose: () => void;
  onViewProfile?: (userPrincipal: Principal) => void;
}

export function UserListModal({
  userPrincipal,
  type,
  onClose,
  onViewProfile,
}: UserListModalProps) {
  const { identity } = useInternetIdentity();

  // Use the appropriate hook based on type
  const { data: followers = [], isLoading: followersLoading } =
    useGetFollowersList(userPrincipal);
  const { data: following = [], isLoading: followingLoading } =
    useGetFollowingList(userPrincipal);

  const data = type === "followers" ? followers : following;
  const isLoading = type === "followers" ? followersLoading : followingLoading;

  const [userData, setUserData] = useState<
    Array<{ principal: Principal; profile: any }>
  >([]);

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isCurrentUser =
    identity?.getPrincipal().toString() === userPrincipal.toString();

  // Fetch profile data for each user
  useEffect(() => {
    const fetchUserData = async () => {
      const userData = await Promise.all(
        data.map(async (userPrincipal) => {
          // We'll use a direct query for each user's profile
          return { principal: userPrincipal, profile: null };
        }),
      );
      setUserData(userData);
    };

    if (data.length > 0) {
      fetchUserData();
    }
  }, [data]);

  const handleFollow = async (targetPrincipal: Principal) => {
    try {
      await followMutation.mutateAsync(targetPrincipal);
    } catch (error) {
      console.error("Failed to follow user:", error);
    }
  };

  const handleUnfollow = async (targetPrincipal: Principal) => {
    try {
      await unfollowMutation.mutateAsync(targetPrincipal);
    } catch (error) {
      console.error("Failed to unfollow user:", error);
    }
  };

  const getTitle = () => {
    if (type === "followers") {
      return isCurrentUser ? "Your Followers" : "Followers";
    }
    return "Following";
  };

  const getEmptyMessage = () => {
    if (type === "followers") {
      return isCurrentUser
        ? "You don't have any followers yet"
        : "No followers yet";
    }
    return isCurrentUser
      ? "You're not following anyone yet"
      : "Not following anyone yet";
  };

  return (
    <BaseModal isOpen={true} onClose={onClose} title={getTitle()} size="md">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full border-b-2 h-8 w-8 border-indigo-500" />
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">{getEmptyMessage()}</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {data.map((userPrincipal) => (
            <UserListItem
              key={userPrincipal.toString()}
              userPrincipal={userPrincipal}
              onViewProfile={onViewProfile}
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
              isCurrentUser={
                identity?.getPrincipal().toString() === userPrincipal.toString()
              }
            />
          ))}
        </div>
      )}
    </BaseModal>
  );
}

interface UserListItemProps {
  userPrincipal: Principal;
  onViewProfile?: (userPrincipal: Principal) => void;
  onFollow: (userPrincipal: Principal) => void;
  onUnfollow: (userPrincipal: Principal) => void;
  isCurrentUser: boolean;
}

function UserListItem({
  userPrincipal,
  onViewProfile,
  onFollow,
  onUnfollow,
  isCurrentUser,
}: UserListItemProps) {
  const { data: profileStats, isLoading } =
    useGetUserProfileWithStats(userPrincipal);
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const profilePictureUrl = useProfilePicture(userPrincipal);

  if (isLoading || !profileStats) {
    return (
      <div className="p-4 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-20 mt-1 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
      <button
        onClick={() => onViewProfile?.(userPrincipal)}
        className="flex items-center space-x-3 flex-1"
      >
        <UserAvatar
          src={profilePictureUrl}
          alt={`${profileStats.displayName}'s profile`}
          size="sm"
        />
        <div className="text-left">
          <div className="font-medium text-gray-800">
            {profileStats.displayName}
          </div>
          <div className="text-sm text-gray-500">@{profileStats.username}</div>
        </div>
      </button>

      {/* Follow/Unfollow Button */}
      {isAuthenticated && !isCurrentUser && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (profileStats.isFollowedByCurrentUser) {
              onUnfollow(userPrincipal);
            } else {
              onFollow(userPrincipal);
            }
          }}
          className={`flex items-center space-x-1 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            profileStats.isFollowedByCurrentUser
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-indigo-500 text-white hover:bg-indigo-600"
          }`}
        >
          {profileStats.isFollowedByCurrentUser ? (
            <>
              <UserMinus className="w-3.5 h-3.5" />
              <span>Following</span>
            </>
          ) : (
            <>
              <UserPlus className="w-3.5 h-3.5" />
              <span>Follow</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
