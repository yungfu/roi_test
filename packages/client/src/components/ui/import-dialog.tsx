"use client"

import * as React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"

interface ImportDialogProps {
  children: React.ReactNode
}

export function ImportDialog({ children }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
  }

  const handleImport = () => {
    if (selectedFile) {
      // 这里添加实际的导入逻辑
      console.log('导入文件:', selectedFile.name)
      setIsOpen(false)
      setSelectedFile(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>导入 ROI 数据</DialogTitle>
          <DialogDescription>
            选择要导入的 CSV 或 Excel 文件。文件应包含ROI分析所需的数据列。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    点击选择文件或拖拽文件到这里
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="mt-2 text-xs text-gray-500">
                  支持 CSV, XLSX, XLS 格式
                </p>
              </div>
            </div>
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Upload className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm text-gray-900">{selectedFile.name}</span>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile}
          >
            导入
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
