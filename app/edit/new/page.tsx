"use client"

import { useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ResumeBuilder from "@/components/resume-builder"
import type { ResumeData } from "@/types/resume"
import { createEntryFromData, StorageError, getResumeById } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

export default function NewEditPage() {
  return <NewEditPageContent />
}

function NewEditPageContent() {
  const router = useRouter()
  const search = useSearchParams()
  const { toast } = useToast()

  const cloneId = search.get("clone")
  const useExample = search.get("example") === "1" || search.get("example") === "true"

  // Clone data can be read synchronously from localStorage
  const clonedData: ResumeData | undefined = useMemo(() => {
    if (!cloneId) return undefined
    const entry = getResumeById(cloneId)
    return entry ? { ...entry.resumeData } : undefined
  }, [cloneId])

  const handleSave = async (current: ResumeData) => {
    try {
      const entry = createEntryFromData(current)
      toast({ title: "保存成功", description: `已创建：${entry.resumeData.title}` })
      router.replace(`/edit/${entry.id}`)
    } catch (e: unknown) {
      if (e instanceof StorageError && e.code === "QUOTA_EXCEEDED") {
        toast({
          title: "保存失败：存储空间不足",
          description: "请删除一些旧的简历，或导出为 JSON 后清理存储。",
          variant: "destructive",
        })
      } else {
        const message = e instanceof Error ? e.message : "未知错误"
        toast({ title: "保存失败", description: message, variant: "destructive" })
      }
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <ResumeBuilder
        // 如果是克隆则直接使用克隆数据；否则让构建器自己加载模板并即时显示默认表单
        initialData={clonedData}
        template={useExample ? "example" : "default"}
        onBack={() => router.push("/")}
        onSave={(d) => handleSave(d)}
      />
    </main>
  )
}
