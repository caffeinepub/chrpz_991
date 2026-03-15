import { Heart, User, Send, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { formatDistanceToNow } from "../utils/dateUtils";
import {
  useLikeComment,
  useUnlikeComment,
  useCreateComment,
  useDeleteComment,
  useGetUserProfile,
} from "../hooks/useQueries";
import type { Comment } from "../backend";
import type { Principal } from "@dfinity/principal";

interface CommentProps {
  comment: Comment;
  isReply?: boolean;
  onViewProfile?: (userPrincipal: Principal) => void;
}

export function Comment({
  comment,
  isReply = false,
  onViewProfile,
}: CommentProps) {
  const { identity } = useInternetIdentity();
  const likeCommentMutation = useLikeComment();
  const unlikeCommentMutation = useUnlikeComment();
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();
  const { data: userProfile } = useGetUserProfile();
  const profilePictureUrl = useMemo(() => {
    if (!comment.authorProfilePicture) return null;
    const uint8Array =
      comment.authorProfilePicture instanceof Uint8Array
        ? comment.authorProfilePicture
        : new Uint8Array(comment.authorProfilePicture);
    const safeArrayBuffer = new ArrayBuffer(uint8Array.byteLength);
    const safeView = new Uint8Array(safeArrayBuffer);
    safeView.set(uint8Array);
    const blob = new Blob([safeView], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  }, [comment.authorProfilePicture]);

  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCommentLike = async (commentId: bigint, isLiked: boolean) => {
    try {
      if (isLiked) {
        await unlikeCommentMutation.mutateAsync({
          commentId,
          postId: comment.postId,
        });
      } else {
        await likeCommentMutation.mutateAsync({
          commentId,
          postId: comment.postId,
        });
      }
    } catch (error) {
      console.error("Error updating comment like:", error);
    }
  };

  const handleAddReply = async () => {
    if (!replyContent.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        postId: comment.postId,
        parentCommentId: comment.id,
        content: replyContent.trim(),
      });
      setReplyContent("");
      setIsReplying(false);
    } catch (error) {
      console.error("Error adding reply:", error);
    }
  };

  const handleDeleteComment = async () => {
    try {
      await deleteCommentMutation.mutateAsync({
        commentId: comment.id,
        postId: comment.postId,
      });
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Check if current user can delete this comment (author only)
  const canDelete =
    identity &&
    comment.author.toString() === identity.getPrincipal().toString();

  return (
    <div
      className={`${isReply ? "ml-8 border-l-2 border-gray-200 pl-4" : ""} py-3`}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={() => onViewProfile?.(comment.author)}
          className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center overflow-hidden hover:scale-105 transition-transform cursor-pointer"
          title={`View ${comment.authorName || "User"}'s profile`}
        >
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt={`${comment.authorName || "User"}'s profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-4 h-4 text-white" />
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <button
              onClick={() => onViewProfile?.(comment.author)}
              className="font-medium text-gray-800 hover:text-indigo-600 transition-colors cursor-pointer"
              title={`View ${comment.authorName || "User"}'s profile`}
            >
              {comment.authorName || "Anonymous User"}
            </button>
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(Number(comment.timestamp))}
            </span>
          </div>
          <p className="text-gray-700 text-sm mb-2">{comment.content}</p>

          {/* Comment Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  handleCommentLike(comment.id, comment.isLikedByCurrentUser)
                }
                className={`flex items-center space-x-1 text-xs transition-colors ${
                  comment.isLikedByCurrentUser
                    ? "text-red-600"
                    : "text-gray-500 hover:text-red-600"
                }`}
              >
                <Heart
                  className={`w-3 h-3 ${comment.isLikedByCurrentUser ? "fill-current" : ""}`}
                />
                <span>{comment.likedBy.length}</span>
              </button>

              {!isReply && (
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Reply
                </button>
              )}
            </div>

            {/* Delete Button (Author/Admin only) */}
            {canDelete && (
              <div className="flex items-center">
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete comment"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-600">Delete?</span>
                    <button
                      onClick={handleDeleteComment}
                      disabled={deleteCommentMutation.isPending}
                      className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors disabled:opacity-50"
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
        </div>
      </div>

      {/* Reply Form */}
      {isReplying && (
        <div className="ml-11 mt-3">
          <div className="flex space-x-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={(e) => e.key === "Enter" && handleAddReply()}
              autoFocus
            />
            <button
              onClick={handleAddReply}
              disabled={!replyContent.trim() || createCommentMutation.isPending}
              className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createCommentMutation.isPending ? (
                <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
