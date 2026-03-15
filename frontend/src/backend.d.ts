import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Comment {
    id: bigint;
    content: string;
    authorName?: string;
    likedBy: Array<Principal>;
    author: Principal;
    timestamp: Time;
    authorProfilePicture?: Uint8Array;
    isLikedByCurrentUser: boolean;
    postId: bigint;
}
export type Username = string;
export type Time = bigint;
export interface UserProfileInput {
    bio?: string;
    username: Username;
    name?: string;
    profilePictureBlob?: Uint8Array;
}
export interface UserProfile {
    bio?: string;
    username: Username;
    displayName: string;
    followersCount: bigint;
    name?: string;
    createdAt: Time;
    updatedAt: Time;
    followingCount: bigint;
    isFollowedByCurrentUser: boolean;
    postsCount: bigint;
}
export interface Post {
    id: bigint;
    content: string;
    authorName?: string;
    likedBy: Array<Principal>;
    author: Principal;
    timestamp: Time;
    authorProfilePicture?: Uint8Array;
    isLikedByCurrentUser: boolean;
}
export interface backendInterface {
    checkUsernameAvailability(username: string): Promise<boolean>;
    createComment(postId: bigint, content: string): Promise<void>;
    createPost(content: string): Promise<void>;
    deleteComment(commentId: bigint): Promise<void>;
    deletePost(id: bigint): Promise<void>;
    followUser(userToFollow: Principal): Promise<void>;
    getAllPosts(): Promise<Array<Post>>;
    getFollowersList(user: Principal): Promise<Array<Principal>>;
    getFollowingFeed(): Promise<Array<Post>>;
    getFollowingList(user: Principal): Promise<Array<Principal>>;
    getPost(id: bigint): Promise<Post | null>;
    getPostComments(postId: bigint): Promise<Array<Comment>>;
    getProfilePictureBlob(userPrincipal: Principal): Promise<Uint8Array | null>;
    getUserByUsername(username: string): Promise<UserProfile | null>;
    getUserPrincipalByUsername(username: string): Promise<Principal | null>;
    getUserProfile(): Promise<UserProfile | null>;
    getUserProfileWithStats(user: Principal): Promise<UserProfile | null>;
    likeComment(commentId: bigint): Promise<void>;
    likePost(postId: bigint): Promise<void>;
    needsProfileSetup(): Promise<boolean>;
    saveUserProfile(profileInput: UserProfileInput): Promise<void>;
    unfollowUser(userToUnfollow: Principal): Promise<void>;
    unlikeComment(commentId: bigint): Promise<void>;
    unlikePost(postId: bigint): Promise<void>;
}
