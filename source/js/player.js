////////////////////////////////////////////////////////////////////////////////////////////////////
// player //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

let $player;

let $np = { };

$(function() {
    $player = document.querySelector("audio.player");

    $np.position = $(".now-playing .position");
    $np.length = $(".now-playing .length");
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
    $(".play", $ui["now-playing"]).on("click", app.Player.toggle);
});

app.Player = (() => {

    // const updateTimeline

    const toggle = () => {
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

    return {
        toggle
    };
})();
