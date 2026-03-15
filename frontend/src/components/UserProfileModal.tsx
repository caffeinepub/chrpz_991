import { useState, useRef, useEffect } from "react";
import { X, Camera, User, Save, Upload, Check } from "lucide-react";
import {
  useGetUserProfile,
  useSaveUserProfile,
  useCheckUsernameAvailability,
} from "../hooks/useQueries";

function base64ToUint8Array(base64: string): Uint8Array {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "");
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

interface UserProfileModalProps {
  onClose: () => void;
}

export function UserProfileModal({ onClose }: UserProfileModalProps) {
  const { data: existingProfile } = useGetUserProfile();
  const saveProfileMutation = useSaveUserProfile();

  const [username, setUsername] = useState(existingProfile?.username || "");
  const [name, setName] = useState(existingProfile?.name || "");
  const [bio, setBio] = useState(existingProfile?.bio || "");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [usernameError, setUsernameError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Username validation
  const {
    data: isUsernameAvailable,
    isFetching: checkingUsernameAvailability,
  } = useCheckUsernameAvailability(username);

  // Check username format client-side
  const isValidUsernameFormat = (username: string): boolean => {
    if (username.length < 3 || username.length > 30) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return false;
    if (/^[_-]|[_-]$/.test(username)) return false;
    return true;
  };

  // Validate username on change
  useEffect(() => {
    if (username && username !== existingProfile?.username) {
      if (!isValidUsernameFormat(username)) {
        setUsernameError(
          "Username must be 3-30 characters, alphanumeric with _ or - (not at start/end)",
        );
      } else if (isUsernameAvailable === false) {
        setUsernameError("Username is already taken");
      } else {
        setUsernameError("");
      }
    } else {
      setUsernameError("");
    }
  }, [username, isUsernameAvailable, existingProfile?.username]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress and convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Resize to max 200x200 to keep under 2MB limit
          const maxSize = 200;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          setProfilePicture(compressedBase64);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Username is required
    if (!username.trim()) {
      setUsernameError("Username is required");
      return;
    }

    // Don't submit if there are username errors
    if (usernameError) return;

    // If username is changing, ensure it's available
    if (username !== existingProfile?.username && !isUsernameAvailable) {
      setUsernameError("Username is not available");
      return;
    }

    try {
      await saveProfileMutation.mutateAsync({
        username: username.trim(),
        name: name.trim() || undefined,
        bio: bio.trim() || undefined,
        profilePictureBlob: profilePicture
          ? base64ToUint8Array(profilePicture)
          : undefined,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
          <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]"
        >
          {/* Profile Picture */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-sm text-gray-500">
              Click the camera icon to upload a photo
            </p>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username *
            </label>
            <div className="relative">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="e.g., johndoe"
                className={`w-full p-4 border rounded-xl focus:ring-2 focus:border-transparent bg-white/50 backdrop-blur-sm pr-10 ${
                  usernameError
                    ? "border-red-300 focus:ring-red-500"
                    : username !== existingProfile?.username &&
                        isUsernameAvailable
                      ? "border-green-300 focus:ring-green-500"
                      : "border-gray-200 focus:ring-indigo-500"
                }`}
                required
              />
              {username && username !== existingProfile?.username && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {checkingUsernameAvailability ? (
                    <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-indigo-500" />
                  ) : usernameError ? (
                    <X className="w-4 h-4 text-red-500" />
                  ) : isUsernameAvailable ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : null}
                </div>
              )}
            </div>
            {usernameError && (
              <p className="mt-1 text-xs text-red-600">{usernameError}</p>
            )}
            {!usernameError &&
              username !== existingProfile?.username &&
              isUsernameAvailable && (
                <p className="mt-1 text-xs text-green-600">
                  Username is available!
                </p>
              )}
          </div>

          {/* Display Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Display Name (Optional)
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How you want to be displayed"
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              If not set, your username will be displayed
            </p>
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="bio"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {bio.length}/500 characters
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !username.trim() ||
                !!usernameError ||
                saveProfileMutation.isPending
              }
              className="flex items-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
            >
              {saveProfileMutation.isPending ? (
                <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-white" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>
                {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
