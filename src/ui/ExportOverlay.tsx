import { useExportStore } from '@/export/useExportStore'

/** Small status pill shown while baking / after export. */
export function ExportOverlay() {
  const status = useExportStore((s) => s.status)
  const message = useExportStore((s) => s.message)
  if (status === 'idle') return null
  return (
    <div className="export-overlay" data-status={status}>
      {status === 'baking' && <span className="export-spinner" />}
      <span>{message}</span>
    </div>
  )
}
