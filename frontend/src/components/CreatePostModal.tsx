import { useState } from "react";
import { X, Send } from "lucide-react";
import { useCreatePost } from "../hooks/useQueries";

interface CreatePostModalProps {
  onClose: () => void;
}

export function CreatePostModal({ onClose }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const createPostMutation = useCreatePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await createPostMutation.mutateAsync(content.trim());
      onClose();
    } catch (error) {
      console.error("Failed to create post:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <h2 className="text-xl font-bold text-gray-800">Create New Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6 relative">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              What's on your mind?
            </label>
            <div className="relative">
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full h-40 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
                required
              />
            </div>

            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {content.length} characters
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim() || createPostMutation.isPending}
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
            >
              {createPostMutation.isPending ? (
                <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-white" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {createPostMutation.isPending ? "Publishing..." : "Publish"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
