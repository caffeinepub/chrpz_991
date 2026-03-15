import { useState, useRef, useEffect } from "react";
import { User, Save, Camera, Check, X } from "lucide-react";
import {
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

export function ProfileSetupModal() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);
  const saveProfileMutation = useSaveUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check username format client-side
  const isValidUsernameFormat = (username: string): boolean => {
    if (username.length < 3 || username.length > 30) return false;
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return false;
    if (
      username.startsWith("_") ||
      username.startsWith("-") ||
      username.endsWith("_") ||
      username.endsWith("-")
    )
      return false;
    return true;
  };

  // Username validation with improved loading state
  const {
    data: isUsernameAvailable,
    isFetching: checkingUsernameAvailability,
  } = useCheckUsernameAvailability(username);

  // Show checking state only if username is valid format and actually being checked
  const showCheckingState =
    checkingUsernameAvailability &&
    username.length >= 3 &&
    isValidUsernameFormat(username);

  // Update username validation
  useEffect(() => {
    if (!username) {
      setUsernameError("");
      return;
    }

    if (!isValidUsernameFormat(username)) {
      setUsernameError(
        "Username must be 3-30 characters, alphanumeric with _ or - (not at start/end)",
      );
      return;
    }

    if (isUsernameAvailable === false) {
      setUsernameError("Username is taken or reserved");
      return;
    }

    if (isUsernameAvailable === true) {
      setUsernameError("");
      return;
    }
  }, [username, isUsernameAvailable]);

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

    // Username is mandatory
    if (!username.trim()) {
      setUsernameError("Username is required");
      return;
    }

    // Validate username format and availability
    if (usernameError || !isUsernameAvailable) {
      return;
    }

    try {
      await saveProfileMutation.mutateAsync({
        username: username.trim(),
        name: name.trim() || undefined, // Name is optional
        bio: bio.trim() || undefined,
        profilePictureBlob: profilePicture
          ? base64ToUint8Array(profilePicture)
          : undefined,
      });
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="p-6 text-center border-b border-gray-200/50">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <div className="text-white font-bold text-2xl leading-none">C</div>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Welcome to Chrpz!
          </h2>
          <p className="text-gray-600">
            Let's set up your profile to get started.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mx-auto mb-4">
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-full shadow-lg transition-colors"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500">
              Optional: Add a profile photo
            </p>
          </div>

          {/* Username - Required */}
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
                    : username && isUsernameAvailable
                      ? "border-green-300 focus:ring-green-500"
                      : "border-gray-200 focus:ring-indigo-500"
                }`}
                required
                autoFocus
              />
              {username && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {showCheckingState ? (
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
            {!usernameError && username && isUsernameAvailable && (
              <p className="mt-1 text-xs text-green-600">
                Username is available!
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Choose a unique username for easy discovery
            </p>
          </div>

          {/* Display Name - Optional */}
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
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none bg-white/50 backdrop-blur-sm"
            />
          </div>

          <button
            type="submit"
            disabled={
              !username.trim() ||
              !!usernameError ||
              !isUsernameAvailable ||
              saveProfileMutation.isPending
            }
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all hover:scale-105 disabled:opacity-50 disabled:transform-none shadow-lg"
          >
            {saveProfileMutation.isPending ? (
              <div className="animate-spin rounded-full border-b-2 h-4 w-4 border-white" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>
              {saveProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
