import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Blob "mo:core/Blob";

actor {

  type Username = Text;

  type UserProfileInput = {
    username : Username;
    name : ?Text;
    bio : ?Text;
    profilePictureBlob : ?Blob;
  };

  type UserProfile = {
    username : Username;
    name : ?Text;
    bio : ?Text;
    createdAt : Time.Time;
    updatedAt : Time.Time;
    displayName : Text;
    followersCount : Nat;
    followingCount : Nat;
    postsCount : Nat;
    isFollowedByCurrentUser : Bool;
  };

  type Comment = {
    id : Nat;
    postId : Nat;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
    likedBy : [Principal];
    authorName : ?Text;
    authorProfilePicture : ?Blob;
    isLikedByCurrentUser : Bool;
  };

  type Post = {
    id : Nat;
    author : Principal;
    content : Text;
    timestamp : Time.Time;
    likedBy : [Principal];
    authorName : ?Text;
    authorProfilePicture : ?Blob;
    isLikedByCurrentUser : Bool;
  };

  type UserRelationship = {
    follower : Principal;
    following : Principal;
    timestamp : Time.Time;
  };

  var userProfiles : Map.Map<Principal, UserProfile> = Map.empty<Principal, UserProfile>();

  var usersByUsername : Map.Map<Username, Principal> = Map.empty<Username, Principal>();

  var reservedUsernames : [Text] = ["admin", "chrpz", "support", "help", "api", "www", "mail", "root", "test", "null", "undefined"];

  var posts : Map.Map<Nat, Post> = Map.empty<Nat, Post>();
  var nextPostId : Nat = 0;

  var comments : Map.Map<Nat, Comment> = Map.empty<Nat, Comment>();
  var nextCommentId : Nat = 0;

  var relationships : Map.Map<Text, UserRelationship> = Map.empty<Text, UserRelationship>();

  // Simple stable storage for profile pictures by Principal
  var profilePictures : [(Principal, Blob)] = [];

  public query ({ caller }) func needsProfileSetup() : async Bool {
    if (caller.isAnonymous()) {
      false; // Anonymous users don't need profile setup
    } else {
      not hasUserProfile(caller);
    };
  };

  public query ({ caller }) func getUserProfile() : async ?UserProfile {
    switch (userProfiles.get(caller)) {
      case (?profile) {
        ?updateProfileForViewer(caller, profile, caller);
      };
      case (null) { null };
    };
  };

  func getDisplayName(profile : UserProfile) : Text {
    switch (profile.name) {
      case (?name) { name };
      case (null) { profile.username };
    };
  };

  func isValidUsernameFormat(username : Text) : Bool {
    let size = username.size();
    size >= 3 and size <= 30;
  };

  func isReservedUsername(username : Text) : Bool {
    reservedUsernames.find(func(reserved) { reserved == username }) != null;
  };

  func isUsernameAvailable(username : Text) : Bool {
    isValidUsernameFormat(username) and not isReservedUsername(username) and not usersByUsername.containsKey(username)
  };

  public query func checkUsernameAvailability(username : Text) : async Bool {
    isUsernameAvailable(username);
  };

  public query func getUserByUsername(username : Text) : async ?UserProfile {
    switch (usersByUsername.get(username)) {
      case (?principal) {
        switch (userProfiles.get(principal)) {
          case (?profile) {
            ?updateProfileForViewer(principal, profile, Principal.fromText("2vxsx-fae"));
          };
          case (null) { null };
        };
      };
      case (null) { null };
    };
  };

  public query func getUserPrincipalByUsername(username : Text) : async ?Principal {
    usersByUsername.get(username);
  };

  func updateUsernameIndexes(oldUsername : ?Text, newUsername : Text, principal : Principal) {
    switch (oldUsername) {
      case (?old) {
        usersByUsername.remove(old);
      };
      case (null) {};
    };
    usersByUsername.add(newUsername, principal);
  };

  func storeProfilePictureBlob(caller : Principal, blob : Blob) : () {
    let size = blob.size();
    if (size > 2 * 1024 * 1024) {
      // 2MB limit
      Runtime.trap("Profile picture too large (max 2MB)");
    };

    // Remove existing profile picture if any
    profilePictures := profilePictures.filter(func((principal, _)) { principal != caller });
    // Add new profile picture
    profilePictures := profilePictures.concat([(caller, blob)]);
  };

  public query func getProfilePictureBlob(userPrincipal : Principal) : async ?Blob {
    switch (profilePictures.find(func((principal, _)) { principal == userPrincipal })) {
      case (?(_, blob)) { ?blob };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveUserProfile(profileInput : UserProfileInput) : async () {
    if (not isUsernameAvailable(profileInput.username)) {
      Runtime.trap("Username unavailable");
    };

    let existingProfile = userProfiles.get(caller);
    let oldUsername = switch (existingProfile) {
      case (?existing) { ?existing.username };
      case (null) { null };
    };

    // Handle profile picture blob storage
    switch (profileInput.profilePictureBlob) {
      case (?blob) {
        storeProfilePictureBlob(caller, blob);
      };
      case (null) {
        // No profile picture provided
      };
    };

    let now = Time.now();
    let profile = {
      username = profileInput.username;
      name = profileInput.name;
      bio = profileInput.bio;
      createdAt = switch (existingProfile) {
        case (?existing) { existing.createdAt };
        case (null) { now };
      };
      updatedAt = now;
      displayName = switch (profileInput.name) {
        case (?name) { name };
        case (null) { profileInput.username };
      };
      followersCount = 0;
      followingCount = 0;
      postsCount = 0;
      isFollowedByCurrentUser = false;
    };

    userProfiles.add(caller, profile);
    updateUsernameIndexes(oldUsername, profileInput.username, caller);
  };

  func updatePostForViewer(post : Post, caller : Principal) : Post {
    let authorInfo = getAuthorInfo(post.author);
    let isLiked = if (caller.isAnonymous()) { false } else {
      post.likedBy.find(func(p) { p == caller }) != null;
    };
    {
      post with
      authorName = authorInfo.displayName;
      authorProfilePicture = authorInfo.profilePicture;
      isLikedByCurrentUser = isLiked;
    };
  };

  func updateCommentForViewer(comment : Comment, caller : Principal) : Comment {
    let authorInfo = getAuthorInfo(comment.author);
    let isLiked = if (caller.isAnonymous()) { false } else {
      comment.likedBy.find(func(p) { p == caller }) != null;
    };
    {
      comment with
      authorName = authorInfo.displayName;
      authorProfilePicture = authorInfo.profilePicture;
      isLikedByCurrentUser = isLiked;
    };
  };

  func updateProfileForViewer(principal : Principal, profile : UserProfile, caller : Principal) : UserProfile {
    {
      profile with
      displayName = getDisplayName(profile);
      followersCount = getFollowersCount(principal);
      followingCount = getFollowingCount(principal);
      postsCount = getUserPostsCount(principal);
      isFollowedByCurrentUser = if (caller.isAnonymous()) { false } else {
        isUserFollowing(caller, principal);
      };
    };
  };

  func getAuthorInfo(authorPrincipal : Principal) : {
    displayName : ?Text;
    profilePicture : ?Blob;
  } {
    let displayName = switch (userProfiles.get(authorPrincipal)) {
      case (?profile) { ?getDisplayName(profile) };
      case (null) { null };
    };

    let profilePicture = switch (profilePictures.find(func((principal, _)) { principal == authorPrincipal })) {
      case (?(_, blob)) { ?blob };
      case (null) { null };
    };

    { displayName; profilePicture };
  };

  func getUserRelationships(user : Principal, getFollower : Bool) : [Principal] {
    let filtered = if (getFollower) {
      relationships.values().filter(func(rel) { rel.following == user });
    } else {
      relationships.values().filter(func(rel) { rel.follower == user });
    };

    filtered.toArray().map(
      func(rel) {
        if (getFollower) { rel.follower } else { rel.following };
      }
    );
  };

  func requireUserAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous users cannot perform this action");
    };
    if (not hasUserProfile(caller)) {
      Runtime.trap("Profile setup required to perform this action");
    };
  };

  func requireOwnership(caller : Principal, owner : Principal) {
    if (caller != owner) {
      Runtime.trap("Unauthorized: Only the owner can perform this action");
    };
  };

  func hasUserProfile(caller : Principal) : Bool {
    userProfiles.containsKey(caller);
  };

  func toggleEntityLike(entityId : Nat, caller : Principal, isPost : Bool) {
    let isAlreadyLiked = if (isPost) {
      switch (posts.get(entityId)) {
        case (?post) {
          post.likedBy.find(func(p) { p == caller }) != null;
        };
        case (null) { Runtime.trap("Post not found") };
      };
    } else {
      switch (comments.get(entityId)) {
        case (?comment) {
          comment.likedBy.find(func(p) { p == caller }) != null;
        };
        case (null) { Runtime.trap("Comment not found") };
      };
    };

    if (isPost) {
      switch (posts.get(entityId)) {
        case (?post) {
          let updatedLikes = if (isAlreadyLiked) {
            post.likedBy.filter(func(p) { p != caller });
          } else {
            post.likedBy.concat([caller]);
          };
          let updatedPost = { post with likedBy = updatedLikes };
          posts.add(entityId, updatedPost);
        };
        case (null) {};
      };
    } else {
      switch (comments.get(entityId)) {
        case (?comment) {
          let updatedLikes = if (isAlreadyLiked) {
            comment.likedBy.filter(func(p) { p != caller });
          } else {
            comment.likedBy.concat([caller]);
          };
          let updatedComment = { comment with likedBy = updatedLikes };
          comments.add(entityId, updatedComment);
        };
        case (null) {};
      };
    };
  };

  public shared ({ caller }) func likePost(postId : Nat) : async () {
    requireUserAuth(caller);
    toggleEntityLike(postId, caller, true);
  };

  public shared ({ caller }) func unlikePost(postId : Nat) : async () {
    requireUserAuth(caller);
    toggleEntityLike(postId, caller, true);
  };

  public shared ({ caller }) func likeComment(commentId : Nat) : async () {
    requireUserAuth(caller);
    toggleEntityLike(commentId, caller, false);
  };

  public shared ({ caller }) func unlikeComment(commentId : Nat) : async () {
    requireUserAuth(caller);
    toggleEntityLike(commentId, caller, false);
  };

  public shared ({ caller }) func deleteComment(commentId : Nat) : async () {
    requireUserAuth(caller);
    switch (comments.get(commentId)) {
      case (?comment) {
        requireOwnership(caller, comment.author);
        comments.remove(commentId);
      };
      case (null) { Runtime.trap("Comment not found") };
    };
  };

  public shared ({ caller }) func createPost(content : Text) : async () {
    requireUserAuth(caller);
    let authorInfo = getAuthorInfo(caller);

    let post : Post = {
      id = nextPostId;
      author = caller;
      content;
      timestamp = Time.now();
      likedBy = [];
      authorName = authorInfo.displayName;
      authorProfilePicture = authorInfo.profilePicture;
      isLikedByCurrentUser = false;
    };
    posts.add(nextPostId, post);

    nextPostId += 1;
  };

  public shared ({ caller }) func deletePost(id : Nat) : async () {
    requireUserAuth(caller);
    switch (posts.get(id)) {
      case (?post) {
        requireOwnership(caller, post.author);
        posts.remove(id);
      };
      case (null) { Runtime.trap("Post not found") };
    };
  };

  public query ({ caller }) func getPost(id : Nat) : async ?Post {
    switch (posts.get(id)) {
      case (?postData) {
        ?updatePostForViewer(postData, caller);
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getAllPosts() : async [Post] {
    posts.values().toArray().sort(
      func(a, b) {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) {
          #greater;
        } else { #equal };
      }
    ).map(func(post) { updatePostForViewer(post, caller) });
  };

  public shared ({ caller }) func createComment(postId : Nat, content : Text) : async () {
    requireUserAuth(caller);
    if (not posts.containsKey(postId)) {
      Runtime.trap("Post not found");
    };

    let authorInfo = getAuthorInfo(caller);
    let comment : Comment = {
      id = nextCommentId;
      postId;
      author = caller;
      content;
      timestamp = Time.now();
      likedBy = [];
      authorName = authorInfo.displayName;
      authorProfilePicture = authorInfo.profilePicture;
      isLikedByCurrentUser = false;
    };
    comments.add(nextCommentId, comment);
    nextCommentId += 1;
  };

  public query ({ caller }) func getPostComments(postId : Nat) : async [Comment] {
    let commentsArray = comments.values().toArray();
    let postComments = commentsArray.filter(func(comment) { comment.postId == postId });
    postComments.sort(
      func(a, b) {
        if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) {
          #greater;
        } else { #equal };
      }
    ).map(func(comment) { updateCommentForViewer(comment, caller) });
  };

  func getRelationshipKey(follower : Principal, following : Principal) : Text {
    follower.toText() # "_" # following.toText();
  };

  func getFollowersCount(user : Principal) : Nat {
    relationships.values().filter(func(rel) { rel.following == user }).size();
  };

  func getFollowingCount(user : Principal) : Nat {
    relationships.values().filter(func(rel) { rel.follower == user }).size();
  };

  func isUserFollowing(follower : Principal, following : Principal) : Bool {
    let key = getRelationshipKey(follower, following);
    relationships.containsKey(key);
  };

  func getUserPostsCount(user : Principal) : Nat {
    posts.values().filter(func(post) { post.author == user }).size();
  };

  public shared ({ caller }) func followUser(userToFollow : Principal) : async () {
    requireUserAuth(caller);

    if (caller == userToFollow) {
      Runtime.trap("Cannot follow yourself");
    };

    let key = getRelationshipKey(caller, userToFollow);
    if (relationships.containsKey(key)) {
      Runtime.trap("Already following this user");
    };
    if (not userProfiles.containsKey(userToFollow)) {
      Runtime.trap("User to follow not found");
    };

    let relationship : UserRelationship = {
      follower = caller;
      following = userToFollow;
      timestamp = Time.now();
    };
    relationships.add(key, relationship);
  };

  public shared ({ caller }) func unfollowUser(userToUnfollow : Principal) : async () {
    requireUserAuth(caller);

    let key = getRelationshipKey(caller, userToUnfollow);
    if (not relationships.containsKey(key)) {
      Runtime.trap("Not following this user");
    };
    relationships.remove(key);
  };

  public query func getFollowingList(user : Principal) : async [Principal] {
    getUserRelationships(user, false);
  };

  public query func getFollowersList(user : Principal) : async [Principal] {
    getUserRelationships(user, true);
  };

  public query ({ caller }) func getUserProfileWithStats(user : Principal) : async ?UserProfile {
    switch (userProfiles.get(user)) {
      case (?profile) {
        ?updateProfileForViewer(user, profile, caller);
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getFollowingFeed() : async [Post] {
    if (caller.isAnonymous()) { [] } else {
      let followingList = getUserRelationships(caller, false);
      let followingPosts = posts.values().toArray().filter(
        func(post) {
          followingList.find(func(user) { user == post.author }) != null;
        }
      );
      followingPosts.sort(
        func(a, b) {
          if (a.timestamp > b.timestamp) { #less } else if (a.timestamp < b.timestamp) {
            #greater;
          } else { #equal };
        }
      ).map(func(post) { updatePostForViewer(post, caller) });
    };
  };
};
