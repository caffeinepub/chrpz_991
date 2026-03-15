import { useQuery } from "@tanstack/react-query";
import { useActor } from "./useActor";
import { useMemo } from "react";
import type { Principal } from "@dfinity/principal";

export function useProfilePicture(userPrincipal: Principal | null | undefined) {
  const { actor } = useActor();

  const { data: blobData } = useQuery({
    queryKey: ["profilePicture", userPrincipal?.toString()],
    queryFn: async () => {
      if (!userPrincipal || !actor) return null;
      return await actor.getProfilePictureBlob(userPrincipal);
    },
    enabled: !!userPrincipal && !!actor,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const imageUrl = useMemo(() => {
    if (!blobData) return null;

    // Convert blob data to Uint8Array if it's a number array
    const uint8Array =
      blobData instanceof Uint8Array ? blobData : new Uint8Array(blobData);
    const safeArrayBuffer = new ArrayBuffer(uint8Array.byteLength);
    const safeView = new Uint8Array(safeArrayBuffer);
    safeView.set(uint8Array);
    const blob = new Blob([safeView], { type: "image/jpeg" });
    return URL.createObjectURL(blob);
  }, [blobData]);

  return imageUrl;
}
