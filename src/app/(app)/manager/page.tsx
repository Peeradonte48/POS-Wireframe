'use client'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { EodSummaryTab } from '@/components/manager/EodSummaryTab'
import { SalesSnapshotTab } from '@/components/manager/SalesSnapshotTab'
import { EightySixTab } from '@/components/manager/EightySixTab'
import { OpenTicketsTab } from '@/components/manager/OpenTicketsTab'

export default function ManagerPage() {
  return (
    <div className="flex flex-col h-full">
      <header className="h-14 border-b flex items-center px-4 shrink-0">
        <h1 className="text-sm font-semibold">Manager</h1>
      </header>
      <Tabs defaultValue="eod" className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full justify-start overflow-x-auto rounded-none border-b h-10 px-2 shrink-0">
          <TabsTrigger value="eod" className="text-xs shrink-0">EOD Summary</TabsTrigger>
          <TabsTrigger value="snapshot" className="text-xs shrink-0">Sales Snapshot</TabsTrigger>
          <TabsTrigger value="86d" className="text-xs shrink-0">86&apos;d Items</TabsTrigger>
          <TabsTrigger value="tickets" className="text-xs shrink-0">Open Tickets</TabsTrigger>
        </TabsList>
        <TabsContent value="eod" className="flex-1 overflow-y-auto"><EodSummaryTab /></TabsContent>
        <TabsContent value="snapshot" className="flex-1 overflow-y-auto"><SalesSnapshotTab /></TabsContent>
        <TabsContent value="86d" className="flex-1 overflow-y-auto"><EightySixTab /></TabsContent>
        <TabsContent value="tickets" className="flex-1 overflow-y-auto"><OpenTicketsTab /></TabsContent>
      </Tabs>
    </div>
  )
}
