"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import ResumeBuilder from "@/components/resume-builder"
import type { ResumeData } from "@/types/resume"
import { createDefaultResumeData } from "@/lib/utils"
import { createEntryFromData, loadDefaultTemplate, StorageError, getResumeById } from "@/lib/storage"
import { useToast } from "@/hooks/use-toast"

export default function NewEditPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background p-6 text-muted-foreground">加载中...</main>}>
      <NewEditPageContent />
    </Suspense>
  )
}

function NewEditPageContent() {
  const router = useRouter()
  const search = useSearchParams()
  const { toast } = useToast()

  const [data, setData] = useState<ResumeData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        // If clone id provided, prefill with that resume's data (without saving)
        const cloneId = search.get("clone")
        if (cloneId) {
          const entry = getResumeById(cloneId)
          if (entry) {
            setData({ ...entry.resumeData })
            setLoading(false)
            return
          }
        }
        // Otherwise try default template
        const tpl = await loadDefaultTemplate()
        const base = tpl ?? createDefaultResumeData()
        if (!base.avatar) base.avatar = "/default-avatar.jpg"
        setData(base)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [search])

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

  if (loading || !data) {
    return <main className="min-h-screen bg-background p-6 text-muted-foreground">加载中...</main>
  }

  return (
    <main className="min-h-screen bg-background">
      <ResumeBuilder
        initialData={data}
        onChange={setData}
        onBack={() => router.push("/")}
        onSave={(d) => handleSave(d)}
      />
    </main>
  )
}
