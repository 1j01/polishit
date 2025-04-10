"use client"

import { useEffect, useState } from "react"

// Extend the Window interface to include onYouTubeIframeAPIReady
// Shouldn't @types/youtube do this? Whatever.
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void
  }
}

function loadYouTubeAPI() {
  // Load the script
  const tag = document.createElement("script")
  tag.src = "https://www.youtube.com/iframe_api"
  const firstScriptTag = document.getElementsByTagName("script")[0]
  firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)

  return new Promise<void>((resolve) => {
    // Register the global callback
    window.onYouTubeIframeAPIReady = resolve
  })
}

let apiReady: Promise<void> | null = null
function loadYouTubeAPIOnce() {
  apiReady ??= loadYouTubeAPI()
  return apiReady
}

// export function useYouTubeAPI() {
//   const [ready, setReady] = useState(false)

//   useEffect(() => {
//     loadYouTubeAPIOnce().then(() => {
//       setReady(true)
//     })
//   }, [])

//   return ready
// }

export function YouTubeEmbed({ elementId = `yt-embed-${crypto.randomUUID()}`, ...options }: { elementId?: string } & YT.PlayerOptions) {
  useEffect(() => {
    let player: YT.Player
    let unmounted = false
    loadYouTubeAPIOnce().then(() => {
      if (unmounted) return
      player = new YT.Player(elementId, options)
    })

    return () => {
      unmounted = true
      player?.destroy()
    }
  }, [])

  return (
    <div>
      <div id={elementId}></div>
    </div>
  )
}
