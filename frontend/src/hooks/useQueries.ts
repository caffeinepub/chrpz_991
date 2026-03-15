import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useState, useEffect } from "react";
import type { Post, UserProfile, UserProfileInput, Comment } from "../backend";
import type { Principal } from "@dfinity/principal";

// Debounce hook for optimizing search/validation queries
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// User Profile Queries
export function useGetUserProfile() {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      const profile = await actor.getUserProfile();
      return profile;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfileInput) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["profilePicture"] });
    },
  });
}

// Username-related queries with enhanced debouncing and caching for better performance
export function useCheckUsernameAvailability(username: string) {
  const { actor, isFetching } = useActor();

  // Enhanced debounce with longer delay for better performance
  const debouncedUsername = useDebounce(username, 600); // Increased to 600ms

  return useQuery<boolean>({
    queryKey: ["usernameAvailability", debouncedUsername],
    queryFn: async () => {
      if (!actor || !debouncedUsername || debouncedUsername.length < 3)
        return false;

      try {
        return await actor.checkUsernameAvailability(debouncedUsername);
      } catch (error) {
        console.error("Username availability check failed:", error);
        // Return false for any errors to prevent confusion
        return false;
      }
    },
    enabled:
      !!actor &&
      !isFetching &&
      !!debouncedUsername &&
      debouncedUsername.length >= 3,
    staleTime: 0, // Always check fresh to prevent showing incorrect availability
    gcTime: 60000, // Keep in cache for 1 minute only
    retry: (failureCount, error) => {
      // Don't retry on validation errors or trapped errors
      if (
        error?.message?.includes("trapped explicitly") ||
        error?.message?.includes("Invalid username") ||
        error?.message?.includes("Anonymous")
      ) {
        return false;
      }
      // Only retry once for network errors
      return failureCount < 1;
    },
    retryDelay: 1000, // 1 second delay between retries
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    refetchOnMount: false, // Don't refetch on component mount if cache is valid
  });
}

export function useGetUserByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userByUsername", username],
    queryFn: async () => {
      if (!actor || !username) return null;
      const profile = await actor.getUserByUsername(username);
      return profile || null;
    },
    enabled: !!actor && !isFetching && !!username,
    staleTime: 60000, // Cache for 1 minute
  });
}

export function useGetUserPrincipalByUsername(username: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal | null>({
    queryKey: ["userPrincipalByUsername", username],
    queryFn: async () => {
      if (!actor || !username) return null;
      const principal = await actor.getUserPrincipalByUsername(username);
      return principal || null;
    },
    enabled: !!actor && !isFetching && !!username,
    staleTime: 60000, // Cache for 1 minute
  });
}

// Post Queries
export function useGetAllPosts() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["posts"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPosts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPost(id: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Post | null>({
    queryKey: ["post", id.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPost(id);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createPost(content);
    },
    onSuccess: () => {
      // Invalidate all post-related queries to refresh feeds
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["followingFeed"] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deletePost(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// Like System Hooks
export function useLikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.likePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["followingFeed"] });
    },
  });
}

export function useUnlikePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: bigint) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unlikePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["followingFeed"] });
    },
  });
}

// Comment System Hooks
export function useGetPostComments(postId: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<Comment[]>({
    queryKey: ["comments", postId.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPostComments(postId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      postId,
      parentCommentId,
      content,
    }: {
      postId: bigint;
      parentCommentId?: bigint;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createComment(postId, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId.toString()],
      });
    },
  });
}

export function useLikeComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      postId,
    }: {
      commentId: bigint;
      postId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.likeComment(commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId.toString()],
      });
    },
  });
}

export function useUnlikeComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      postId,
    }: {
      commentId: bigint;
      postId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unlikeComment(commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId.toString()],
      });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      commentId,
      postId,
    }: {
      commentId: bigint;
      postId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteComment(commentId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.postId.toString()],
      });
    },
  });
}

// Following System Hooks
export function useFollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userToFollow: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.followUser(userToFollow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followingList"] });
      queryClient.invalidateQueries({ queryKey: ["followersList"] });
      queryClient.invalidateQueries({ queryKey: ["userProfileWithStats"] });
      queryClient.invalidateQueries({ queryKey: ["followingFeed"] });
    },
  });
}

export function useUnfollowUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userToUnfollow: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unfollowUser(userToUnfollow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followingList"] });
      queryClient.invalidateQueries({ queryKey: ["followersList"] });
      queryClient.invalidateQueries({ queryKey: ["userProfileWithStats"] });
      queryClient.invalidateQueries({ queryKey: ["followingFeed"] });
    },
  });
}

export function useGetFollowingList(user: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["followingList", user.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFollowingList(user);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetFollowersList(user: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ["followersList", user.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFollowersList(user);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProfile(user: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ["userProfileWithStats", user.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfileWithStats(user);
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility with existing components
export const useGetUserProfileWithStats = useGetProfile;

// Feed and Recommendation Hooks
export function useGetFollowingFeed() {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ["followingFeed"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFollowingFeed();
    },
    enabled: !!actor && !isFetching,
  });
}
