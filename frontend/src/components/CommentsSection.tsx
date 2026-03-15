import { Send, User } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { Comment } from "./Comment";
import {
  useGetPostComments,
  useCreateComment,
  useGetUserProfile,
} from "../hooks/useQueries";
import { useProfilePicture } from "../hooks/useProfilePicture";
import type { Principal } from "@dfinity/principal";

interface CommentsSectionProps {
  postId: bigint;
  onViewProfile?: (userPrincipal: Principal) => void;
}

export function CommentsSection({
  postId,
  onViewProfile,
}: CommentsSectionProps) {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetUserProfile();
  const createCommentMutation = useCreateComment();
  const { data: comments = [], isLoading: commentsLoading } =
    useGetPostComments(postId);
  const userPrincipal = identity?.getPrincipal();
  const userProfilePictureUrl = useProfilePicture(userPrincipal);

  const [newComment, setNewComment] = useState("");

  const isAuthenticated = !!identity;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        postId,
        content: newComment.trim(),
      });
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <>
      {/* Comments Section - Always visible when component is rendered */}
      {isAuthenticated && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          {/* Add Comment Form */}
          <div className="mb-6">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                {userProfilePictureUrl ? (
                  <img
                    src={userProfilePictureUrl}
                    alt="Your profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  disabled={
                    !newComment.trim() || createCommentMutation.isPending
                  }
                  className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCommentMutation.isPending ? (
                    <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-white" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-1">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full border-b-2 h-8 w-8 border-indigo-500" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <Comment
                  key={comment.id.toString()}
                  comment={comment}
                  onViewProfile={onViewProfile}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
