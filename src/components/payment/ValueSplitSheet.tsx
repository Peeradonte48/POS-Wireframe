"use client";

import { useEffect, useState } from "react";
import { Coins, CirclePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useBillStore } from "@/stores/bill.store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SplitItem {
  id: number;
  amount: number;
}

interface ValueSplitSheetProps {
  open: boolean;
  onClose: () => void;
  grandTotal: number;
  tableId: string;
  onProceed: () => void;
}

// ---------------------------------------------------------------------------
// ValueSplitSheet
// ---------------------------------------------------------------------------

export function ValueSplitSheet({
  open,
  onClose,
  grandTotal,
  tableId,
  onProceed,
}: ValueSplitSheetProps) {
  const [splitItems, setSplitItems] = useState<SplitItem[]>([]);
  const [inputStr, setInputStr] = useState("");
  const [nextId, setNextId] = useState(1);

  // Reset state when sheet opens
  useEffect(() => {
    if (open) {
      setSplitItems([]);
      setInputStr("");
      setNextId(1);
    }
  }, [open]);

  const totalSplit = splitItems.reduce((sum, item) => sum + item.amount, 0);
  const remaining = Math.max(0, grandTotal - totalSplit);
  const isBalanceClear = totalSplit >= grandTotal && splitItems.length > 0;

  const currentAmount = inputStr === "" ? 0 : parseFloat(inputStr) || 0;

  // ---------------------------------------------------------------------------
  // Numpad handler
  // ---------------------------------------------------------------------------

  function handleKey(key: string) {
    if (key === "backspace") {
      setInputStr((prev) => prev.slice(0, -1));
      return;
    }
    if (key === ".") {
      if (inputStr.includes(".")) return;
      setInputStr((prev) => (prev === "" ? "0." : prev + "."));
      return;
    }
    const dotIdx = inputStr.indexOf(".");
    if (dotIdx !== -1 && inputStr.length - dotIdx > 2) return;
    if (inputStr === "0" && key !== ".") {
      setInputStr(key);
      return;
    }
    setInputStr((prev) => prev + key);
  }

  // ---------------------------------------------------------------------------
  // Add / remove item
  // ---------------------------------------------------------------------------

  function handleAddItem() {
    if (currentAmount <= 0 || remaining <= 0) return;
    const amount = Math.min(currentAmount, remaining);
    setSplitItems((prev) => [...prev, { id: nextId, amount }]);
    setNextId((n) => n + 1);
    setInputStr("");
  }

  function handleRemoveItem(id: number) {
    setSplitItems((prev) => prev.filter((item) => item.id !== id));
  }

  // ---------------------------------------------------------------------------
  // Proceed — persist to bill store then navigate
  // ---------------------------------------------------------------------------

  function handleProceed() {
    const { initCustomSplit, setCustomAmount } = useBillStore.getState();
    initCustomSplit(tableId, splitItems.length);
    splitItems.forEach((item, i) => {
      setCustomAmount(tableId, i, item.amount);
    });
    onProceed();
  }

  const displayAmount =
    inputStr === "" ? "0.00" : (parseFloat(inputStr) || 0).toFixed(2);

  const numpadRows = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    [".", "0", "backspace"],
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        showCloseButton
        className="h-[90vh] flex flex-col gap-0 p-0"
      >
        {/* Header */}
        <div className="flex gap-[10px] items-start px-6 pt-6 pb-4 shrink-0">
          <Button
            variant="secondary"
            size="icon"
            className="shrink-0"
            aria-label="แบ่งจ่าย"
          >
            <Coins size={16} />
          </Button>
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <p className="font-semibold text-lg leading-7">แบ่งจ่าย</p>
            <p className="text-sm text-muted-foreground leading-5">
              กรอกจำนวนเงินที่ต้องการแบ่งจ่าย
            </p>
          </div>
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 gap-6 px-6 pb-6 overflow-hidden">
          {/* Left: รายการชำระ card */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div
              className="bg-card border border-border rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="px-6 py-4 shrink-0">
                <p className="font-semibold text-base tracking-tight truncate">
                  รายการชำระ
                </p>
              </div>
              <div className="flex-1 bg-muted border-t border-border min-h-[80px] overflow-hidden">
                {splitItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-center py-8 px-6">
                    <p className="font-medium text-base text-foreground">
                      กรุณาเพิ่มการชำระเงิน
                    </p>
                    <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                      <li>ระบุยอดที่ต้องการแบ่งชำระ</li>
                      <li>กด &ldquo;เพิ่มรายการ&rdquo;</li>
                    </ol>
                  </div>
                ) : (
                  <ScrollArea className="h-full px-3 py-2">
                    <div className="flex flex-col gap-2">
                      {splitItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="bg-card border border-border rounded-xl overflow-hidden"
                          style={{ boxShadow: "var(--shadow-card)" }}
                        >
                          <div className="flex items-center gap-2 p-6">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm leading-5 text-foreground whitespace-nowrap">
                                แบ่งจ่าย #{index + 1}
                              </p>
                            </div>
                            <p className="text-sm text-foreground whitespace-nowrap">
                              ฿
                              {item.amount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })}
                            </p>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-9 shrink-0 opacity-50"
                              onClick={() => handleRemoveItem(item.id)}
                              aria-label="Remove"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          </div>

          {/* Right: numpad section */}
          <div className="w-[320px] shrink-0 flex flex-col gap-5 overflow-y-auto">
            {/* Remaining display */}
            <div className="flex flex-col gap-4 items-center">
              <p className="font-medium text-2xl text-foreground leading-8">
                ยอดค้างชำระ
              </p>
              {isBalanceClear ? (
                <p className="font-semibold text-4xl text-green-600 leading-10">
                  ไม่มียอดค้าง
                </p>
              ) : (
                <p className="font-semibold text-4xl text-destructive leading-10">
                  ฿
                  {remaining.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>

            <Separator />

            {/* Input + numpad */}
            <div className="flex flex-col gap-4">
              <p className="font-semibold text-base text-muted-foreground">
                ยอดที่ต้องการแบ่งชำระ
              </p>

              <div className="bg-muted flex items-center justify-end px-3 py-3 rounded-lg">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-xl text-muted-foreground leading-none">
                    ฿
                  </span>
                  <span className="font-semibold text-3xl text-foreground leading-9">
                    {displayAmount}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-[4px]">
                {numpadRows.map((row, rowIdx) => (
                  <div key={rowIdx} className="flex gap-[5px]">
                    {row.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleKey(key)}
                        className="flex-1 h-16 bg-muted rounded-lg flex items-center justify-center text-[26px] font-normal text-foreground hover:bg-accent transition-colors"
                        aria-label={key === "backspace" ? "Delete" : key}
                      >
                        {key === "backspace" ? (
                          <span className="text-2xl leading-none">⌫</span>
                        ) : (
                          <span className="tabular-nums">{key}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {isBalanceClear ? (
                <Button
                  size="cta"
                  className="w-full h-14 text-base font-semibold"
                  onClick={handleProceed}
                >
                  ดำเนินการชำระเงิน
                </Button>
              ) : (
                <Button
                  size="cta"
                  className="w-full h-10 gap-2"
                  disabled={currentAmount <= 0 || remaining <= 0}
                  onClick={handleAddItem}
                >
                  <CirclePlus size={16} />
                  เพิ่มรายการ
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
