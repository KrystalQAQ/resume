"use client"

import { useEffect, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import type { ResumeData } from "@/types/resume"
import { Button } from "@/components/ui/button"
import { Icon } from "@iconify/react"

// 动态导入 PDF 组件，禁用 SSR
const DynamicPDFViewer = dynamic(
  () => import("@/components/pdf-viewer").then((mod) => mod.PDFViewer),
  { ssr: false }
)

function PDFPreviewContent() {
  // 在首屏渲染时保持为 null，避免因读取 sessionStorage 导致 SSR/CSR 标记不一致
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [fallback, setFallback] = useState(false)
  // derive from location to avoid setState in effect
  const serverFilename = typeof window !== 'undefined'
    ? (window.location.pathname || '').split('/').filter(Boolean).pop()
    : undefined

  // Wire postMessage handshake once
  useEffect(() => {
    // 1) 首次挂载后再从 sessionStorage 恢复数据，确保与服务器标记一致
    try {
      const cached = sessionStorage.getItem('resumeData')
      if (cached) {
        const parsed: ResumeData = JSON.parse(cached)
        if (typeof queueMicrotask === 'function') {
          queueMicrotask(() => setResumeData(parsed))
        } else {
          setTimeout(() => setResumeData(parsed), 0)
        }
      }
    } catch { }

    const handleMessage = (event: MessageEvent) => {
      const payload = (event as unknown as { data?: { type?: string; data?: ResumeData } }).data;
      if (payload?.type === 'resumeData' && payload.data) {
        setResumeData(payload.data);
        try { sessionStorage.setItem('resumeData', JSON.stringify(payload.data)); } catch { }
      }
    };
    window.addEventListener('message', handleMessage);
    if (window.opener) {
      window.opener.postMessage({ type: 'ready' }, '*');
    }
    return () => window.removeEventListener('message', handleMessage);
  }, [])

  if (!resumeData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg mb-4">正在加载简历数据...</p>
      </div>
    )
  }

  return (
    <div className="pdf-preview-page-root flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
      {fallback && (
        <div className="flex items-center justify-between p-4 border-b no-print print:hidden">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-bold">PDF预览</h1>
            <div className="flex items-baseline gap-1 text-xs text-muted-foreground">
              <Icon icon="mdi:alert-circle" className="w-3.5 h-3.5 text-amber-600" />
              <span>服务器不可用，已切换为浏览器打印。请在打印对话框中关闭“页眉和页脚”，勾选“背景图形”。</span>
              <Button size="sm" className="ml-2 h-6 px-2 py-1 text-xs" onClick={() => window.print()}>
                打印/保存为 PDF
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-hidden flex print:overflow-visible print:h-auto">
        <div className="w-full h-full print:h-auto">
          <DynamicPDFViewer
            resumeData={resumeData}
            renderNotice="external"
            serverFilename={serverFilename}
            onModeChange={(m) => setFallback(m === "fallback")}
          />
        </div>
      </div>
    </div>
  )
}

export default function PDFPreviewPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg mb-4">加载中...</p>
      </div>
    }>
      <PDFPreviewContent />
    </Suspense>
  )
}

