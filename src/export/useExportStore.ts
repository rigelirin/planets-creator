import { create } from 'zustand'

export type ExportStatus = 'idle' | 'baking' | 'done' | 'error'
export type ResolutionName = 'Preview' | 'Standard' | 'High'
export type ExportFormat = 'glb' | 'gltf' | 'stl' | 'obj' | 'usdz'

type ExportState = {
  status: ExportStatus
  message: string
  resolution: ResolutionName
  format: ExportFormat
  setStatus: (status: ExportStatus, message: string) => void
  setResolution: (resolution: ResolutionName) => void
  setFormat: (format: ExportFormat) => void
}

export const useExportStore = create<ExportState>((set) => ({
  status: 'idle',
  message: '',
  resolution: 'Standard',
  format: 'glb',
  setStatus: (status, message) => set({ status, message }),
  setResolution: (resolution) => set({ resolution }),
  setFormat: (format) => set({ format }),
}))
