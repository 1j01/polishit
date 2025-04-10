import { useEffect } from "react"

// Extend the Window interface to include onYouTubeIframeAPIReady
// Shouldn't @types/youtube do this? Whatever.
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void
  }
}

export function YouTubeEmbed() {
  useEffect(() => {
    // Check if the YouTube API is already loaded
    if (typeof YT !== "undefined") {
      return
    }
    // 2. This code loads the IFrame Player API code asynchronously.
    let tag = document.createElement('script')

    tag.src = "https://www.youtube.com/iframe_api"
    let firstScriptTag = document.getElementsByTagName('script')[0]!
    firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag)

    // 3. This function creates an <iframe> (and YouTube player)
    //    after the API code downloads.
    let player: YT.Player
    window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
      player = new YT.Player('youtube-player', {
        height: '390',
        width: '640',
        videoId: 'zBflZLStKQg',
        playerVars: {
          'playsinline': 1
        },
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      })
    }

    // 4. The API will call this function when the video player is ready.
    function onPlayerReady(event: YT.PlayerEvent) {
      event.target.playVideo()
    }

    // 5. The API calls this function when the player's state changes.
    //    The function indicates that when playing a video (state=1),
    //    the player should play for six seconds and then stop.
    let done = false
    function onPlayerStateChange(event: YT.PlayerEvent) {
      if (event.data == YT.PlayerState.PLAYING && !done) {
        setTimeout(stopVideo, 6000)
        done = true
      }
    }
    function stopVideo() {
      player.stopVideo()
    }
  }, [])

  return (
    <div>
      <div id="youtube-player"></div>
    </div>
  )
}
