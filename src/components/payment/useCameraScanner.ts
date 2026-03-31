'use client'

import { useState } from 'react'

// ---------------------------------------------------------------------------
// useCameraScanner
// ---------------------------------------------------------------------------
// Manages camera coupon scan flow state:
// - cameraOpen / setCameraOpen — controls the CameraSheet visibility
// - scannedCode — the coupon code most recently scanned
// - handleScan — validates and records a scan result
// - clearScan — resets the scanned code state
// ---------------------------------------------------------------------------

export interface CameraScannerResult {
  cameraOpen: boolean
  setCameraOpen: (open: boolean) => void
  scannedCode: string | null
  handleScan: (code: string) => void
  clearScan: () => void
}

export function useCameraScanner(): CameraScannerResult {
  const [cameraOpen, setCameraOpen] = useState(false)
  const [scannedCode, setScannedCode] = useState<string | null>(null)

  function handleScan(code: string) {
    if (!code.trim()) return
    setScannedCode(code.trim())
    setCameraOpen(false)
  }

  function clearScan() {
    setScannedCode(null)
  }

  return {
    cameraOpen,
    setCameraOpen,
    scannedCode,
    handleScan,
    clearScan,
  }
}
