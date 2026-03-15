import { useState, useCallback } from "react";
import { Principal } from "@dfinity/principal";
import type { SortCriteria } from "./useSorting";

interface AppState {
  showCreatePost: boolean;
  showProfile: boolean;
  viewingUserProfile: string | null;
  viewingUserPrincipal: string | null;
  currentFeedTab: "community" | "following";
  sortBy: SortCriteria;
}

export function useAppState() {
  const [state, setState] = useState<AppState>({
    showCreatePost: false,
    showProfile: false,
    viewingUserProfile: null,
    viewingUserPrincipal: null,
    currentFeedTab: "community",
    sortBy: "latest",
  });

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handlers = {
    handleViewProfile: useCallback(
      (userPrincipal: Principal) => {
        updateState({
          viewingUserPrincipal: userPrincipal.toString(),
          viewingUserProfile: null,
          showProfile: false,
        });
      },
      [updateState],
    ),

    handleHomeNavigation: useCallback(() => {
      updateState({
        currentFeedTab: "community",
        viewingUserProfile: null,
        viewingUserPrincipal: null,
        showProfile: false,
      });
    }, [updateState]),

    toggleCreatePost: useCallback(() => {
      setState((prev) => ({ ...prev, showCreatePost: !prev.showCreatePost }));
    }, []),

    toggleProfile: useCallback(() => {
      setState((prev) => ({ ...prev, showProfile: !prev.showProfile }));
    }, []),

    setSortBy: useCallback(
      (sortBy: SortCriteria) => {
        updateState({ sortBy });
      },
      [updateState],
    ),

    setCurrentFeedTab: useCallback(
      (currentFeedTab: "community" | "following") => {
        updateState({ currentFeedTab });
      },
      [updateState],
    ),
  };

  return {
    state,
    handlers: {
      ...handlers,
      updateState,
    },
    // Computed values
    isAuthenticated: state.viewingUserProfile !== null,
  };
}
