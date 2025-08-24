import { DarkThemeToggle } from '@/components/DarkThemeToggle'
import { Button } from '@/components/ui/button'
import { ImportDialog } from '@/components/ui/import-dialog'
import { Upload } from 'lucide-react'
import type { Metadata } from 'next'

import './globals.css'



export const metadata: Metadata = {
  title: 'ROI Analyze',
  description: 'ROI Analysis Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <div className="min-h-screen bg-background">
          <header className="border-b">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">ROI Analyze</h1>
                <div className="flex items-center gap-3">
                  <DarkThemeToggle />
                  <ImportDialog>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      导入数据
                    </Button>
                  </ImportDialog>
                </div>
              </div>
            </div>
          </header>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
