import { Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "../utils/dateUtils";
import { UserAvatar } from "./UserAvatar";
import { useMemo } from "react";
import type { Post } from "../backend";
import type { Principal } from "@dfinity/principal";

interface PostHeaderProps {
  post: Post;
  onViewProfile?: (userPrincipal: Principal) => void;
  isCompact?: boolean;
}

export function PostHeader({
  post,
  onViewProfile,
  isCompact = false,
}: PostHeaderProps) {
  const profilePictureUrl = useMemo(() => {
    if (!post.authorProfilePicture) return null;
    const uint8Array =
      post.authorProfilePicture instanceof Uint8Array
        ? post.authorProfilePicture
        : new Uint8Array(post.authorProfilePicture);
    const safeArrayBuffer = new ArrayBuffer(uint8Array.byteLength);
    const safeView = new Uint8Array(safeArrayBuffer);
    safeView.set(uint8Array);
    const blob = new Blob([safeView], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  }, [post.authorProfilePicture]);

  return (
    <div className="flex items-start space-x-3 mb-4">
      {/* Profile Picture */}
      <UserAvatar
        src={profilePictureUrl}
        alt={`${post.authorName || "User"}'s profile`}
        size="md"
        className="hover:scale-105 transition-transform cursor-pointer"
        onClick={() => onViewProfile?.(post.author)}
        title={`View ${post.authorName || "User"}'s profile`}
      />

      {/* Author Info */}
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onViewProfile?.(post.author)}
            className={`font-semibold text-gray-800 hover:text-indigo-600 transition-colors cursor-pointer ${
              isCompact ? "text-sm" : "text-base"
            }`}
            title={`View ${post.authorName || "User"}'s profile`}
          >
            {post.authorName || "Anonymous User"}
          </button>
        </div>
        <div className="flex items-center space-x-2 text-gray-500">
          <Calendar className={isCompact ? "w-3 h-3" : "w-4 h-4"} />
          <span className={isCompact ? "text-xs" : "text-sm"}>
            {formatDistanceToNow(Number(post.timestamp))}
          </span>
        </div>
      </div>
    </div>
  );
}
