import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useLikePost,
  useUnlikePost,
  useDeletePost,
  useGetUserProfile,
} from "../hooks/useQueries";
import type { Post } from "../backend";

interface PostActionsProps {
  post: Post;
  commentsCount: number;
  onToggleComments: () => void;
  isCompact?: boolean;
}

export function PostActions({
  post,
  commentsCount,
  onToggleComments,
  isCompact = false,
}: PostActionsProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetUserProfile();
  const likePostMutation = useLikePost();
  const unlikePostMutation = useUnlikePost();
  const deletePostMutation = useDeletePost();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canDelete =
    identity && post.author.toString() === identity.getPrincipal().toString();

  const handleLike = async () => {
    try {
      if (post.isLikedByCurrentUser) {
        await unlikePostMutation.mutateAsync(post.id);
      } else {
        await likePostMutation.mutateAsync(post.id);
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deletePostMutation.mutateAsync(post.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="flex items-center space-x-4">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={likePostMutation.isPending || unlikePostMutation.isPending}
          className={`flex items-center space-x-1 transition-colors ${
            post.isLikedByCurrentUser
              ? "text-red-500 hover:text-red-600"
              : "text-gray-500 hover:text-red-500"
          } ${isCompact ? "text-xs" : "text-sm"}`}
        >
          <Heart
            className={`${isCompact ? "w-3 h-3" : "w-4 h-4"} ${
              post.isLikedByCurrentUser ? "fill-current" : ""
            }`}
          />
          <span>{post.likedBy.length}</span>
        </button>

        {/* Comments Button */}
        <button
          onClick={onToggleComments}
          className={`flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors ${
            isCompact ? "text-xs" : "text-sm"
          }`}
        >
          <MessageCircle className={isCompact ? "w-3 h-3" : "w-4 h-4"} />
          <span>{commentsCount}</span>
        </button>
      </div>

      {/* Delete Button (Admin/Author only) */}
      {canDelete && (
        <div className="relative">
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className={`text-gray-400 hover:text-red-500 transition-colors ${
                isCompact ? "text-xs" : "text-sm"
              }`}
              title="Delete post"
            >
              <Trash2 className={isCompact ? "w-3 h-3" : "w-4 h-4"} />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-600">Delete?</span>
              <button
                onClick={handleDelete}
                disabled={deletePostMutation.isPending}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400 transition-colors"
              >
                No
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
