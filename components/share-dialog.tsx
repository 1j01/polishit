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

const BlueskyIcon = ({ className }: { className?: string }) => (
  // https://upload.wikimedia.org/wikipedia/commons/7/7a/Bluesky_Logo.svg
  <svg role="img" viewBox="0 0 600 530" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" fill="#1185fe" />
  </svg>
)

const FacebookIcon = ({ className }: { className?: string }) => (
  // <svg role="img" viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg"><title>Facebook</title><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 2.848-5.978 5.817-5.978.952 0 1.872.415 2.344.645v2.716c-.22-.126-1.956-1.12-2.805-.446-.771.611-.849 1.921-.781 2.642v2h3.562l-.78 3.667h-2.782v7.98H9.101Z" /></svg>
  // https://upload.wikimedia.org/wikipedia/commons/b/b9/2023_Facebook_icon.svg
  <svg role="img" version="1.1" viewBox="0 0 666.66668 666.66717" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1.3333333,0,0,-1.3333333,-133.33333,799.99999)"><g><g><g transform="translate(600,350)"><path d="m 0,0 c 0,138.071 -111.929,250 -250,250 -138.071,0 -250,-111.929 -250,-250 0,-117.245 80.715,-215.622 189.606,-242.638 v 166.242 h -51.552 V 0 h 51.552 v 32.919 c 0,85.092 38.508,124.532 122.048,124.532 15.838,0 43.167,-3.105 54.347,-6.211 V 81.986 c -5.901,0.621 -16.149,0.932 -28.882,0.932 -40.993,0 -56.832,-15.528 -56.832,-55.9 V 0 h 81.659 l -14.028,-76.396 h -67.631 V -248.169 C -95.927,-233.218 0,-127.818 0,0" style={{ fill: "#0866ff", fillOpacity: 1, fillRule: "nonzero", stroke: "none" }} /></g><g transform="translate(447.9175,273.6036)"><path d="M 0,0 14.029,76.396 H -67.63 v 27.019 c 0,40.372 15.838,55.899 56.831,55.899 12.733,0 22.981,-0.31 28.882,-0.931 v 69.253 c -11.18,3.106 -38.509,6.212 -54.347,6.212 -83.539,0 -122.048,-39.441 -122.048,-124.533 V 76.396 h -51.552 V 0 h 51.552 v -166.242 c 19.343,-4.798 39.568,-7.362 60.394,-7.362 10.254,0 20.358,0.632 30.288,1.831 L -67.63,0 Z" style={{ fill: "#ffffff", fillOpacity: 1, fillRule: "nonzero", stroke: "none" }} /></g></g></g></g></svg>
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
