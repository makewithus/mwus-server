import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NoticeState {
  readIds: string[];
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  toggleRead: (id: string) => void;
}

export const useNoticeStore = create<NoticeState>()(
  persist(
    (set) => ({
      readIds: [],
      markAsRead: (id) =>
        set((state) => ({
          readIds: state.readIds.includes(id) ? state.readIds : [...state.readIds, id],
        })),
      markAsUnread: (id) =>
        set((state) => ({
          readIds: state.readIds.filter((readId) => readId !== id),
        })),
      toggleRead: (id) =>
        set((state) => ({
          readIds: state.readIds.includes(id)
            ? state.readIds.filter((readId) => readId !== id)
            : [...state.readIds, id],
        })),
    }),
    {
      name: "mwu-notice-storage",
    }
  )
);
