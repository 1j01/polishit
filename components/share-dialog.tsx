"use client"

import { useState } from "react"
import { Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ShareDialogProps {
  initialTitle: string
  initialSubtitle: string
}

export function ShareDialog({ initialTitle, initialSubtitle }: ShareDialogProps) {
  const [shareTitle, setShareTitle] = useState(initialTitle)
  const [shareSubtitle, setShareSubtitle] = useState(initialSubtitle)
  const [copied, setCopied] = useState(false)

  const generateLink = () => {
    if (typeof window === "undefined") return ""
    const url = new URL(window.location.href)
    if (shareTitle !== "No. 2") url.searchParams.set("t", shareTitle)
    else url.searchParams.delete("t")

    if (shareSubtitle !== "Do Your Duty") url.searchParams.set("s", shareSubtitle)
    else url.searchParams.delete("s")

    return url.toString()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generateLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full h-12 w-12 bg-white/80 backdrop-blur border-blue-200 hover:bg-white hover:text-blue-600 transition-colors">
          <Share2 className="h-5 w-5" />
          <span className="sr-only">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share PolishIt!</DialogTitle>
          <DialogDescription>
            Create a custom link to share with your friends.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Pedestal Title</Label>
            <Input
              id="title"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder="No. 2"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subtitle">Pedestal Subtitle</Label>
            <Input
              id="subtitle"
              value={shareSubtitle}
              onChange={(e) => setShareSubtitle(e.target.value)}
              placeholder="Do Your Duty"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="link" className="sr-only">
                Link
              </Label>
              <Input
                id="link"
                value={generateLink()}
                readOnly
                className="bg-muted text-muted-foreground font-mono text-xs"
              />
            </div>
            <Button type="button" size="sm" className="px-3" onClick={copyLink}>
              <span className="sr-only">Copy</span>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
