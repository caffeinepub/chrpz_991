import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useState, useEffect } from "react";
import { PostHeader } from "./PostHeader";
import { PostActions } from "./PostActions";
import { CommentsSection } from "./CommentsSection";
import { useGetPostComments } from "../hooks/useQueries";
import type { Post } from "../backend";
import type { Principal } from "@dfinity/principal";

interface PostCardProps {
  post: Post;
  onViewProfile?: (userPrincipal: Principal) => void;
  isCompact?: boolean;
}

export function PostCard({
  post,
  onViewProfile,
  isCompact = false,
}: PostCardProps) {
  const { identity } = useInternetIdentity();
  const { data: comments = [] } = useGetPostComments(post.id);
  const [showComments, setShowComments] = useState(false);

  const isAuthenticated = !!identity;

  const handleToggleComments = () => {
    setShowComments(!showComments);
  };

  return (
    <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      {/* Post Header */}
      <PostHeader
        post={post}
        onViewProfile={onViewProfile}
        isCompact={isCompact}
      />

      {/* Post Content */}
      <div className="mb-3">
        <div
          className={`text-gray-800 leading-relaxed whitespace-pre-wrap ${
            isCompact ? "text-sm" : "text-base"
          }`}
        >
          {post.content}
        </div>
      </div>

      {/* Post Actions */}
      <PostActions
        post={post}
        commentsCount={comments.length}
        onToggleComments={handleToggleComments}
        isCompact={isCompact}
      />

      {/* Comments Section */}
      {showComments && (
        <CommentsSection postId={post.id} onViewProfile={onViewProfile} />
      )}
    </article>
  );
}
