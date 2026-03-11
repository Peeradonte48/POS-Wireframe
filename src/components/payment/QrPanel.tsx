'use client'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface QrPanelProps {
  grandTotal: number
  discountApplied?: number
}

// ---------------------------------------------------------------------------
// QrPanel
// ---------------------------------------------------------------------------

export function QrPanel({ grandTotal, discountApplied }: QrPanelProps) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      {/* Total amount */}
      <p className="font-bold text-xl">฿{grandTotal.toLocaleString()}</p>
      {discountApplied && discountApplied > 0 && (
        <p className="text-sm text-muted-foreground">
          (after ฿{discountApplied.toLocaleString()} discount)
        </p>
      )}

      {/* Static mock QR — purely decorative */}
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        className="border rounded mx-auto"
        aria-hidden="true"
      >
        {/* Top-left finder pattern */}
        <rect x="10" y="10" width="49" height="49" fill="black" />
        <rect x="17" y="17" width="35" height="35" fill="white" />
        <rect x="24" y="24" width="21" height="21" fill="black" />

        {/* Top-right finder pattern */}
        <rect x="141" y="10" width="49" height="49" fill="black" />
        <rect x="148" y="17" width="35" height="35" fill="white" />
        <rect x="155" y="24" width="21" height="21" fill="black" />

        {/* Bottom-left finder pattern */}
        <rect x="10" y="141" width="49" height="49" fill="black" />
        <rect x="17" y="148" width="35" height="35" fill="white" />
        <rect x="24" y="155" width="21" height="21" fill="black" />

        {/* Data grid — random-looking 4×4 blocks filling interior */}
        {/* Row 1 of data cells */}
        <rect x="70" y="10" width="4" height="4" fill="black" />
        <rect x="78" y="10" width="4" height="4" fill="black" />
        <rect x="90" y="10" width="4" height="4" fill="black" />
        <rect x="102" y="10" width="4" height="4" fill="black" />
        <rect x="110" y="10" width="4" height="4" fill="black" />
        <rect x="118" y="10" width="4" height="4" fill="black" />
        <rect x="126" y="10" width="4" height="4" fill="black" />

        <rect x="70" y="18" width="4" height="4" fill="black" />
        <rect x="86" y="18" width="4" height="4" fill="black" />
        <rect x="102" y="18" width="4" height="4" fill="black" />
        <rect x="118" y="18" width="4" height="4" fill="black" />
        <rect x="130" y="18" width="4" height="4" fill="black" />

        <rect x="74" y="26" width="4" height="4" fill="black" />
        <rect x="82" y="26" width="4" height="4" fill="black" />
        <rect x="94" y="26" width="4" height="4" fill="black" />
        <rect x="106" y="26" width="4" height="4" fill="black" />
        <rect x="122" y="26" width="4" height="4" fill="black" />

        {/* Data rows in the middle band */}
        <rect x="10" y="70" width="4" height="4" fill="black" />
        <rect x="22" y="70" width="4" height="4" fill="black" />
        <rect x="34" y="70" width="4" height="4" fill="black" />
        <rect x="46" y="70" width="4" height="4" fill="black" />
        <rect x="62" y="70" width="4" height="4" fill="black" />
        <rect x="74" y="70" width="4" height="4" fill="black" />
        <rect x="90" y="70" width="4" height="4" fill="black" />
        <rect x="106" y="70" width="4" height="4" fill="black" />
        <rect x="118" y="70" width="4" height="4" fill="black" />
        <rect x="130" y="70" width="4" height="4" fill="black" />
        <rect x="146" y="70" width="4" height="4" fill="black" />
        <rect x="162" y="70" width="4" height="4" fill="black" />
        <rect x="178" y="70" width="4" height="4" fill="black" />

        <rect x="14" y="78" width="4" height="4" fill="black" />
        <rect x="30" y="78" width="4" height="4" fill="black" />
        <rect x="42" y="78" width="4" height="4" fill="black" />
        <rect x="58" y="78" width="4" height="4" fill="black" />
        <rect x="70" y="78" width="4" height="4" fill="black" />
        <rect x="86" y="78" width="4" height="4" fill="black" />
        <rect x="98" y="78" width="4" height="4" fill="black" />
        <rect x="114" y="78" width="4" height="4" fill="black" />
        <rect x="126" y="78" width="4" height="4" fill="black" />
        <rect x="138" y="78" width="4" height="4" fill="black" />
        <rect x="154" y="78" width="4" height="4" fill="black" />
        <rect x="170" y="78" width="4" height="4" fill="black" />

        <rect x="10" y="86" width="4" height="4" fill="black" />
        <rect x="26" y="86" width="4" height="4" fill="black" />
        <rect x="38" y="86" width="4" height="4" fill="black" />
        <rect x="54" y="86" width="4" height="4" fill="black" />
        <rect x="66" y="86" width="4" height="4" fill="black" />
        <rect x="82" y="86" width="4" height="4" fill="black" />
        <rect x="94" y="86" width="4" height="4" fill="black" />
        <rect x="110" y="86" width="4" height="4" fill="black" />
        <rect x="122" y="86" width="4" height="4" fill="black" />
        <rect x="134" y="86" width="4" height="4" fill="black" />
        <rect x="150" y="86" width="4" height="4" fill="black" />
        <rect x="166" y="86" width="4" height="4" fill="black" />
        <rect x="182" y="86" width="4" height="4" fill="black" />

        <rect x="18" y="94" width="4" height="4" fill="black" />
        <rect x="34" y="94" width="4" height="4" fill="black" />
        <rect x="50" y="94" width="4" height="4" fill="black" />
        <rect x="62" y="94" width="4" height="4" fill="black" />
        <rect x="78" y="94" width="4" height="4" fill="black" />
        <rect x="90" y="94" width="4" height="4" fill="black" />
        <rect x="106" y="94" width="4" height="4" fill="black" />
        <rect x="118" y="94" width="4" height="4" fill="black" />
        <rect x="130" y="94" width="4" height="4" fill="black" />
        <rect x="142" y="94" width="4" height="4" fill="black" />
        <rect x="158" y="94" width="4" height="4" fill="black" />
        <rect x="174" y="94" width="4" height="4" fill="black" />

        <rect x="10" y="102" width="4" height="4" fill="black" />
        <rect x="22" y="102" width="4" height="4" fill="black" />
        <rect x="38" y="102" width="4" height="4" fill="black" />
        <rect x="54" y="102" width="4" height="4" fill="black" />
        <rect x="70" y="102" width="4" height="4" fill="black" />
        <rect x="82" y="102" width="4" height="4" fill="black" />
        <rect x="98" y="102" width="4" height="4" fill="black" />
        <rect x="114" y="102" width="4" height="4" fill="black" />
        <rect x="126" y="102" width="4" height="4" fill="black" />
        <rect x="138" y="102" width="4" height="4" fill="black" />
        <rect x="154" y="102" width="4" height="4" fill="black" />
        <rect x="170" y="102" width="4" height="4" fill="black" />

        <rect x="14" y="110" width="4" height="4" fill="black" />
        <rect x="30" y="110" width="4" height="4" fill="black" />
        <rect x="46" y="110" width="4" height="4" fill="black" />
        <rect x="58" y="110" width="4" height="4" fill="black" />
        <rect x="74" y="110" width="4" height="4" fill="black" />
        <rect x="86" y="110" width="4" height="4" fill="black" />
        <rect x="102" y="110" width="4" height="4" fill="black" />
        <rect x="118" y="110" width="4" height="4" fill="black" />
        <rect x="134" y="110" width="4" height="4" fill="black" />
        <rect x="146" y="110" width="4" height="4" fill="black" />
        <rect x="162" y="110" width="4" height="4" fill="black" />
        <rect x="178" y="110" width="4" height="4" fill="black" />

        <rect x="10" y="118" width="4" height="4" fill="black" />
        <rect x="26" y="118" width="4" height="4" fill="black" />
        <rect x="42" y="118" width="4" height="4" fill="black" />
        <rect x="54" y="118" width="4" height="4" fill="black" />
        <rect x="66" y="118" width="4" height="4" fill="black" />
        <rect x="82" y="118" width="4" height="4" fill="black" />
        <rect x="94" y="118" width="4" height="4" fill="black" />
        <rect x="110" y="118" width="4" height="4" fill="black" />
        <rect x="126" y="118" width="4" height="4" fill="black" />
        <rect x="142" y="118" width="4" height="4" fill="black" />
        <rect x="158" y="118" width="4" height="4" fill="black" />
        <rect x="174" y="118" width="4" height="4" fill="black" />

        {/* Bottom data rows */}
        <rect x="70" y="142" width="4" height="4" fill="black" />
        <rect x="82" y="142" width="4" height="4" fill="black" />
        <rect x="94" y="142" width="4" height="4" fill="black" />
        <rect x="110" y="142" width="4" height="4" fill="black" />
        <rect x="126" y="142" width="4" height="4" fill="black" />
        <rect x="142" y="142" width="4" height="4" fill="black" />
        <rect x="158" y="142" width="4" height="4" fill="black" />
        <rect x="174" y="142" width="4" height="4" fill="black" />

        <rect x="66" y="150" width="4" height="4" fill="black" />
        <rect x="78" y="150" width="4" height="4" fill="black" />
        <rect x="94" y="150" width="4" height="4" fill="black" />
        <rect x="106" y="150" width="4" height="4" fill="black" />
        <rect x="118" y="150" width="4" height="4" fill="black" />
        <rect x="134" y="150" width="4" height="4" fill="black" />
        <rect x="150" y="150" width="4" height="4" fill="black" />
        <rect x="166" y="150" width="4" height="4" fill="black" />
        <rect x="182" y="150" width="4" height="4" fill="black" />

        <rect x="70" y="158" width="4" height="4" fill="black" />
        <rect x="86" y="158" width="4" height="4" fill="black" />
        <rect x="98" y="158" width="4" height="4" fill="black" />
        <rect x="114" y="158" width="4" height="4" fill="black" />
        <rect x="130" y="158" width="4" height="4" fill="black" />
        <rect x="146" y="158" width="4" height="4" fill="black" />
        <rect x="162" y="158" width="4" height="4" fill="black" />

        <rect x="74" y="166" width="4" height="4" fill="black" />
        <rect x="90" y="166" width="4" height="4" fill="black" />
        <rect x="102" y="166" width="4" height="4" fill="black" />
        <rect x="118" y="166" width="4" height="4" fill="black" />
        <rect x="134" y="166" width="4" height="4" fill="black" />
        <rect x="150" y="166" width="4" height="4" fill="black" />
        <rect x="170" y="166" width="4" height="4" fill="black" />

        <rect x="66" y="174" width="4" height="4" fill="black" />
        <rect x="82" y="174" width="4" height="4" fill="black" />
        <rect x="98" y="174" width="4" height="4" fill="black" />
        <rect x="110" y="174" width="4" height="4" fill="black" />
        <rect x="126" y="174" width="4" height="4" fill="black" />
        <rect x="142" y="174" width="4" height="4" fill="black" />
        <rect x="158" y="174" width="4" height="4" fill="black" />
        <rect x="174" y="174" width="4" height="4" fill="black" />

        <rect x="70" y="182" width="4" height="4" fill="black" />
        <rect x="86" y="182" width="4" height="4" fill="black" />
        <rect x="102" y="182" width="4" height="4" fill="black" />
        <rect x="118" y="182" width="4" height="4" fill="black" />
        <rect x="130" y="182" width="4" height="4" fill="black" />
        <rect x="146" y="182" width="4" height="4" fill="black" />
        <rect x="162" y="182" width="4" height="4" fill="black" />
      </svg>

      {/* Label */}
      <p className="text-sm text-muted-foreground mt-2">Scan to pay with PromptPay</p>
    </div>
  )
}
