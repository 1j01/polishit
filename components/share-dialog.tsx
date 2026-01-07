"use client"

import { useState } from "react"
import { Share2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DEFAULT_PLAQUE_TITLE, DEFAULT_PLAQUE_SUBTITLE } from "@/lib/constants"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><title>X</title><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /></svg>
)

// FIXME: AI doesn't know Bluesky logo
const BlueskyIcon = ({ className }: { className?: string }) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><title>Bluesky</title><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.845.425-5.885 2.269-5.885 5.617 0 .684.378 1.879.904 2.183.528.307 1.83.626 2.45.626 1.45 0 2.65-.964 3.71-3.264.674-1.48 1.57-4.12 3.814-7.986 2.245 3.814 6.505 3.814 7.986 1.06 2.298 2.26 3.264 3.71 3.264 .62 0 1.923-.32 2.45-.626 .526-.304 .904-1.5 .904-2.183 0-3.348-2.04-5.192-5.885-5.617-.14-.017-.278-.035-.415-.057.14.018.279.036.415.057 2.67.295 5.568-.628 6.383-3.364 .246-.828 .624-5.79 .624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.686 12 10.8Z" /></svg>
)

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 2.848-5.978 5.817-5.978.952 0 1.872.415 2.344.645v2.716c-.22-.126-1.956-1.12-2.805-.446-.771.611-.849 1.921-.781 2.642v2h3.562l-.78 3.667h-2.782v7.98H9.101Z" /></svg>
)

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
    if (shareTitle !== DEFAULT_PLAQUE_TITLE || shareSubtitle !== DEFAULT_PLAQUE_SUBTITLE) {
      url.searchParams.set("t", shareTitle)
      url.searchParams.set("s", shareSubtitle)
    } else {
      url.searchParams.delete("t")
      url.searchParams.delete("s")
    }
    return url.toString()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generateLink())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = (platform: 'twitter' | 'bluesky' | 'facebook') => {
    const url = generateLink()
    // const text = `Check out this polished turd: ${shareTitle} - ${shareSubtitle}`
    const text = "Can you polish it?"
    // const text = `Can you polish it? I managed to get ${percentPolished}%`;
    // const text = `Help polish ${shareTitle}'s legacy!`

    let shareUrl = ''
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
        break
      case 'bluesky':
        shareUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(text + " " + url)}`
        break
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        break
    }
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full h-9 md:h-12 px-3 md:px-4 gap-2 bg-white/80 backdrop-blur border-blue-200 hover:bg-white hover:text-blue-600 transition-colors">
          <Share2 className="h-4 w-4 md:h-5 md:w-5" />
          <span className="text-sm md:text-base">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share PolishIt!</DialogTitle>
          <DialogDescription>
            Create a custom link to share with your friends.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Plaque Title</Label>
            <Input
              id="title"
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value)}
              placeholder={DEFAULT_PLAQUE_TITLE}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subtitle">Plaque Subtitle</Label>
            <Textarea
              id="subtitle"
              value={shareSubtitle}
              onChange={(e) => setShareSubtitle(e.target.value)}
              placeholder={DEFAULT_PLAQUE_SUBTITLE}
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

          <div className="flex gap-2 justify-center pt-4 border-t mt-2">
            <Button variant="outline" size="icon" onClick={() => handleShare('twitter')} title="Share on X">
              <TwitterIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('bluesky')} title="Share on Bluesky">
              <BlueskyIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => handleShare('facebook')} title="Share on Facebook">
              <FacebookIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
