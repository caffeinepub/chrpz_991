# Chrpz

## Overview

Chrpz is a modern social media platform focused on microblogging and community interaction with Internet Identity authentication. Users can create posts, engage through comments and likes, build social connections via following relationships, and manage their profiles. The platform features a clean, minimalistic design with a cosmic-themed color palette and responsive layout optimized for both desktop and mobile devices.

## Authentication

- Users must authenticate using Internet Identity before accessing platform features
- Anonymous users can view public content but cannot create posts or interact with content
- Profile setup is required after first authentication with username validation
- Login and logout functionality integrated throughout the application interface

## Core Features

### User Profile Management

- Comprehensive user profiles with username, display name, bio, and profile picture asset keys
- Profile creation requires unique username validation with real-time availability checking
- Users can update their profile information including display name, bio, and profile picture
- Profile pages display user statistics including follower count, following count, and total posts
- Personal profile editing with immediate updates reflected across the platform
- Public profile viewing for discovering other users and their content
- Profile picture storage optimized using asset key references instead of base64 strings

### Post Creation and Management

- Simple text post creation with content validation
- Post deletion functionality for authors
- Character limits and content validation to ensure quality posts
- All posts displayed in chronological order with newest posts first
- Post authoring information displayed with profile pictures and usernames

### Social Interaction System

- Comprehensive like system for posts with real-time count updates
- Comment system with threading support for rich conversations
- Comment likes with individual like tracking and count display
- Comments sorted to show newest comments first for better user experience
- Follow/unfollow functionality to build social connections
- Following feed showing posts from followed users in chronological order
- User discovery through profile browsing and following lists

### Content Discovery and Feeds

- Home feed displaying all posts from the platform in chronological order
- Following feed showing posts exclusively from followed users
- Post sorting with newest content prioritized for better engagement
- User search functionality for finding users by username
- Following and follower list viewing with user interaction capabilities

### Profile Picture Management

- Profile pictures stored using asset key references for optimal performance
- Consistent profile picture display across all components (posts, comments, headers)
- UserAvatar component handles profile picture rendering with fallback to user icons
- Profile picture upload and management through user profile editing

## Backend Data Storage

- **User Profiles**: Store authenticated principals, usernames, display names, bios, profile picture asset keys, creation timestamps, and follower/following statistics
- **Posts**: Store post content, author information, creation timestamps, and like counts with author profile information
- **Comments**: Store comment content, author data, parent post references, like counts, and author profile information
- **Social Relationships**: Store follower/following connections with timestamps and bidirectional relationship tracking
- **Likes**: Store like records for both posts and comments with user principals
- **Username Index**: Maintain unique username mapping for user discovery and validation

## Backend Operations

- Internet Identity authentication and user session management
- User registration with username uniqueness validation and profile creation
- Real-time username availability checking with debounced validation
- Post creation with author information embedding and chronological sorting
- Comment creation with threading support and newest-first sorting
- Like/unlike operations for posts and comments with count synchronization
- Follow/unfollow operations with relationship management and feed updates
- User profile updates with immediate propagation across all user content
- Search operations for users by username
- Profile picture asset key management for optimized storage

## User Interface Design

- Modern glassmorphism design aesthetic with clean, translucent interface elements
- Prominent "Chrpz" branding with distinctive "C" logo in cosmic-themed containers
- Cosmic color palette featuring indigo-to-purple gradients (#6366f1 to #8b5cf6)
- Accent colors including emerald green (#10b981), red (#ef4444), and blue (#3b82f6)
- Responsive design optimized for desktop, tablet, and mobile devices
- Top header navigation with user authentication controls and profile access
- Main content area with clean post display and interaction elements
- Interactive post creation modal with text input and validation
- Profile pages with statistics, post history, and social interaction elements
- Settings and preferences accessible through user profile section

### Navigation System

- Top header with logo, brand name, and user controls on the right
- User dropdown menu with profile access and logout functionality
- Clean, minimal navigation without overwhelming interface elements
- Mobile-responsive header that adapts to smaller screen sizes
- Consistent navigation patterns throughout the application

### Component Architecture

- **TopHeader**: Main navigation with logo, branding, and user controls
- **Header**: Secondary navigation for feed switching (Home/Following)
- **MainContent**: Central content area with post creation and feed display
- **PostCard**: Individual post display with actions and author information
- **PostHeader**: Post author information with profile pictures and timestamps
- **Comment**: Individual comment display with threading and interaction
- **CommentsSection**: Comment list management with newest-first sorting
- **UserProfilePage**: Personal profile view with posts and statistics
- **PublicUserProfile**: Public user profile viewing with follow functionality
- **UserProfileModal**: Profile editing interface with real-time validation
- **ProfileSetupModal**: Initial profile creation for new users
- **UserAvatar**: Consistent profile picture display component
- **CreatePostModal**: Post creation interface with validation

## Mobile Responsive Design

- Touch-optimized interface elements with appropriate tap targets for mobile interaction
- Responsive navigation that adapts to mobile screen sizes
- Mobile-first design approach ensuring optimal experience on smaller screens
- Optimized typography and spacing for readability on mobile devices
- Mobile-optimized user interface patterns for post creation, commenting, and user interaction
- Responsive image handling and profile picture display across all device sizes
- Mobile-friendly forms and input handling with appropriate keyboard types

## Performance and Optimization

- Optimized React Query implementation with intelligent caching and background updates
- Debounced search and validation queries to reduce backend load and improve responsiveness
- Efficient component architecture with reusable UI elements and minimal re-renders
- Asset key-based profile picture storage for improved performance over base64
- Smart data fetching with proper loading states and error handling
- Optimistic UI updates for likes, follows, and other user interactions
- Clean component separation for maintainable and scalable codebase

## Design System

- Minimalistic design approach with clean layouts and cosmic-themed elements
- Consistent color palette with indigo/purple gradients as primary brand colors
- Clean typography with proper hierarchy and readability
- Glass-morphism effects with subtle transparency and backdrop blur
- Cosmic gradient containers for logo and brand elements
- Consistent spacing and padding throughout the interface
- Professional user experience with intuitive interaction patterns
- Theme consistency across all components and interface elements

## Technical Implementation

- **Frontend**: React with TypeScript, TanStack Query for data management, Tailwind CSS for styling
- **Backend**: Motoko actor with transient maps for efficient data management
- **Storage**: Optimized profile picture storage using asset key references
- **Authentication**: Internet Identity integration with secure session management
- **State Management**: React Query for server state, React hooks for local state
- **Validation**: Real-time username availability checking with proper error handling
- **Sorting**: Chronological content display with newest-first prioritization for posts and comments
