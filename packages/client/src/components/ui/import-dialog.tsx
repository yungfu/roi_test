"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ImportResponse, importService } from "@/services/importService"
import { AlertCircle, CheckCircle, Loader2, Upload } from "lucide-react"
import * as React from "react"
import { useState } from "react"

interface ImportDialogProps {
  children: React.ReactNode
}

export function ImportDialog({ children }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setSelectedFile(file || null)
    // 清除之前的结果和错误
    setImportResult(null)
    setErrorMessage(null)
  }

  const handleImport = async () => {
    if (selectedFile) {
      setIsLoading(true)
      setErrorMessage(null)
      setImportResult(null)

      try {
        console.log('开始导入文件:', selectedFile.name)
        const result = await importService.importFile(selectedFile)
        setImportResult(result)
        
        if (result.success) {
          console.log('导入成功:', result.message)
          // 成功后延迟关闭对话框
          setTimeout(() => {
            setIsOpen(false)
            setSelectedFile(null)
            setImportResult(null)
          }, 2000)
        } else {
          console.error('导入失败:', result.message)
        }
      } catch (error) {
        console.error('导入过程中发生错误:', error)
        if (error instanceof Error && error.message.includes('超时')) {
          setErrorMessage('导入过程超时，但数据可能仍在后台处理中。请稍后刷新页面检查结果。')
        } else {
          setErrorMessage(error instanceof Error ? error.message : '导入失败')
        }
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false)
      setSelectedFile(null)
      setImportResult(null)
      setErrorMessage(null)
    }
  }

  const renderImportStatus = () => {
    if (importResult) {
      return (
        <div className={`flex items-center p-3 rounded-lg ${
          importResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {importResult.success ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          <div>
            <p className="font-medium">{importResult.message}</p>
            {importResult.data && importResult.success && (
              <p className="text-sm">已导入 {importResult.data.importedCount} 条记录</p>
            )}
            {importResult.data?.errors && importResult.data.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium">错误详情:</p>
                <ul className="text-xs list-disc list-inside">
                  {importResult.data.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )
    }

    if (errorMessage) {
      return (
        <div className="flex items-center p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{errorMessage}</p>
        </div>
      )
    }

    return null
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
                    disabled={isLoading}
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
                  disabled={isLoading}
                >
                  ×
                </button>
              </div>
            )}
            {renderImportStatus()}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            {importResult?.success ? '完成' : '取消'}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                导入中...
              </>
            ) : (
              '导入'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
