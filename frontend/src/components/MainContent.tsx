import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { MessageCircle, Users, Heart, Clock, Send } from "lucide-react";
import { PostCard } from "./PostCard";
import { CreatePostModal } from "./CreatePostModal";
import { useCreatePost } from "../hooks/useQueries";
import { useState, useRef } from "react";
import type { Post } from "../backend";
import type { Principal } from "@dfinity/principal";

interface MainContentProps {
  posts: Post[];
  postsLoading: boolean;
  onCreatePost: () => void;
  currentFeedTab: "community" | "following";
  onFeedTabChange: (tab: "community" | "following") => void;
  onViewProfile: (userPrincipal: Principal) => void;
  sortBy: "latest" | "likes";
  onSortChange: (sort: "latest" | "likes") => void;
}

export function MainContent({
  posts,
  postsLoading,
  onCreatePost,
  currentFeedTab,
  onFeedTabChange,
  onViewProfile,
  sortBy,
  onSortChange,
}: MainContentProps) {
  const { identity } = useInternetIdentity();
  const createPostMutation = useCreatePost();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [quickPostContent, setQuickPostContent] = useState("");

  const postInputRef = useRef<HTMLInputElement>(null);
  const isAuthenticated = !!identity;

  const handleQuickPost = async () => {
    if (!quickPostContent.trim()) return;

    try {
      await createPostMutation.mutateAsync(quickPostContent.trim());
      setQuickPostContent("");
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  const handleQuickPostKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleQuickPost();
    }
  };

  const handleQuickPostFocus = () => {
    // If user tries to write a longer post, open the full modal
    if (quickPostContent.length > 100) {
      setShowCreateModal(true);
      setQuickPostContent("");
    }
  };

  if (postsLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full border-b-2 h-8 w-8 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Feed Header */}
      <div className="space-y-4">
        {/* Feed Title */}
        <h2 className="text-2xl font-bold text-gray-800">
          {currentFeedTab === "following" ? "Following Feed" : "Community Feed"}
        </h2>

        {/* Feed Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Feed Tab Controls */}
          {isAuthenticated && (
            <div className="flex items-center">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-1">
                <button
                  onClick={() => onFeedTabChange("community")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentFeedTab === "community"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Community</span>
                </button>
                <button
                  onClick={() => onFeedTabChange("following")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    currentFeedTab === "following"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Following</span>
                </button>
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => onSortChange("latest")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                sortBy === "latest"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Latest</span>
            </button>
            <button
              onClick={() => onSortChange("likes")}
              className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
                sortBy === "likes"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Popular</span>
            </button>
          </div>
        </div>
      </div>

      {/* Post Creation */}
      {isAuthenticated && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            What's happening?
          </h3>
          <div className="flex items-start space-x-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
                <input
                  ref={postInputRef}
                  type="text"
                  placeholder="Share your thoughts with the community..."
                  value={quickPostContent}
                  onChange={(e) => setQuickPostContent(e.target.value)}
                  onKeyDown={handleQuickPostKeyPress}
                  onFocus={handleQuickPostFocus}
                  className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-500"
                  maxLength={280}
                />
                <div className="flex items-center space-x-3">
                  {quickPostContent && (
                    <span className="text-xs text-gray-400">
                      {quickPostContent.length}/280
                    </span>
                  )}
                  <button
                    onClick={
                      quickPostContent.length > 100
                        ? () => setShowCreateModal(true)
                        : handleQuickPost
                    }
                    disabled={
                      !quickPostContent.trim() || createPostMutation.isPending
                    }
                    className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                  >
                    {createPostMutation.isPending ? (
                      <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-white" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {quickPostContent.length > 100 ? "Write More" : "Post"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Press <span className="font-medium">Cmd/Ctrl + Enter</span> to
                post quickly
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for Following Tab */}
      {currentFeedTab === "following" && posts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No posts from followed users
          </h3>
          <p className="text-gray-500 mb-6">
            Follow other users to see their posts in your feed!
          </p>
          <button
            onClick={() => onFeedTabChange("community")}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-full transition-colors"
          >
            Explore Community
          </button>
        </div>
      )}

      {/* Empty State for Community Tab */}
      {currentFeedTab === "community" && posts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-500 mb-6">
            Be the first to share your thoughts with the community!
          </p>
          {isAuthenticated && (
            <button
              onClick={onCreatePost}
              className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-full transition-colors"
            >
              Create First Post
            </button>
          )}
        </div>
      )}

      {/* Posts List */}
      {posts.length > 0 && (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id.toString()}
              post={post}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreatePostModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
