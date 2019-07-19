////////////////////////////////////////////////////////////////////////////////////////////////////
// player //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

let $player;

let $np = { };

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
