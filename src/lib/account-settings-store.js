import { create } from 'zustand'

/** Global state for opening Account Settings modal from header or settings page */
export const useAccountSettingsStore = create((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}))
