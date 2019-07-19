////////////////////////////////////////////////////////////////////////////////////////////////////
// player //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

let $player;

let $np = { };

if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
        "title": "Under Cover of Darkness",
        "artist": "The Strokes",
        "album": "Angles",
        "artwork": [
            {
                "src": "https://lh3.ggpht.com/Cc4TZKHRq_rdChujsY__QSMO0Hcmw9kPomu9zE06vz-tjKgiVaPo4evmIyN6Gp1owl9uRK_rE-c",
                "sizes": "512x512",
                "type": "image/png"
            }
        ]
    });

    navigator.mediaSession.setActionHandler("play", app.Player.play);
    navigator.mediaSession.setActionHandler("pause", app.Player.pause);
    // navigator.mediaSession.setActionHandler("seekbackward", function () { });
    // navigator.mediaSession.setActionHandler("seekforward", function () { });
    // navigator.mediaSession.setActionHandler("previoustrack", function () { });
    // navigator.mediaSession.setActionHandler("nexttrack", function () { });
}

$(function() {
    $player = document.querySelector("audio.player");

    $np.position = $(".now-playing .position");
    $np.length = $(".now-playing .length");
    $np.timeline = $(".now-playing .bar");
    $np.elapsed = $(".now-playing .elapsed");

    $player.addEventListener("timeupdate", (event) => {
        let length = duration($player.duration);
        $np.length.text(length);

        let position = duration($player.currentTime);
        $np.position.text(position);

        let percent = $player.currentTime / $player.duration * 100;
        $np.elapsed.css("width", percent + "%");

        // console.log(position_is_seconds, human_position);
    });

    $ui["now-playing"] = $(".now-playing");
    $(".play", $ui["now-playing"]).on("click", app.Player.playPause);

    // Cliques na linha do tempo
    $np.timeline.on("click", (event) => {
        let width = $(event.delegateTarget).width();
        let position = event.offsetX;
        let percent = position / width;

        let position_in_seconds = $player.duration * percent;
        app.Player.skipToPosition(position_in_seconds);
    });
});

app.Player = (() => {

    // const updateTimeline

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.skipToPosition()
    const skipToPosition = (seconds) => {
        $player.currentTime = seconds;
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.play()
    const play = () => {
        $player.play();
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.pause()
    const pause = () => {
        $player.pause();
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.playPause()
    const playPause = () => {
        if ($player.paused) {
            $player.play();
        } else {
            $player.pause();
        }

        // console.log("duration", $player.duration);
        // console.log("volume", $player.volume);

        // console.log("buffered", $player.buffered);
        // console.log("networkState", $player.networkState);
        // console.log("played", $player.played);
        // console.log("readyState", $player.readyState);
        // console.log("seekable", $player.seekable);
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////

    return {
        skipToPosition,
        play,
        pause,
        playPause
    };
})();
