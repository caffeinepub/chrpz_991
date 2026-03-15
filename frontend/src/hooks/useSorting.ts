import { useMemo } from "react";

export type SortCriteria = "latest" | "likes";

export interface Sortable {
  timestamp: bigint;
  likedBy: Array<any>;
}

export function useSorting<T extends Sortable>(
  items: T[],
  sortBy: SortCriteria,
): T[] {
  return useMemo(() => {
    if (!items?.length) return [];

    return [...items].sort((a, b) => {
      if (sortBy === "latest") {
        return Number(b.timestamp - a.timestamp);
      } else {
        return b.likedBy.length - a.likedBy.length;
      }
    });
  }, [items, sortBy]);
}

export function useMultipleSorting<T extends Sortable>(
  itemGroups: { [key: string]: T[] },
  sortBy: SortCriteria,
): { [key: string]: T[] } {
  return useMemo(() => {
    const sortedGroups: { [key: string]: T[] } = {};

    for (const [key, items] of Object.entries(itemGroups)) {
      if (!items?.length) {
        sortedGroups[key] = [];
        continue;
      }

      sortedGroups[key] = [...items].sort((a, b) => {
        if (sortBy === "latest") {
          return Number(b.timestamp - a.timestamp);
        } else {
          return b.likedBy.length - a.likedBy.length;
        }
      });
    }

    return sortedGroups;
  }, [itemGroups, sortBy]);
}
