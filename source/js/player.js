////////////////////////////////////////////////////////////////////////////////////////////////////
// player //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

let queue = [
    {
        "title": "Captain Calvin (Original Mix)",
        "artist": "Louk",
        "album": "Chillhop Essentials Winter 2018",
        "length": 140,
        "file": "/data/files/14 Captain Calvin (Original Mix).mp3"
    },
    {
        "title": "Tico Tico",
        "artist": "Oscar Peterson",
        "album": "Ultimate Jazz Collections",
        "length": 180,
        "file": "/data/files/30 Tico Tico.m4a"
    }
];


app.Player = (() => {
    let $player = document.createElement("audio");
    let $np = { };
    let queue_position = 0;

    $(function() {
        // Carrega a primeira música da fila
        $player.src = queue[queue_position]["file"];

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
        $(".skip-prev", $ui["now-playing"]).on("click", app.Player.previousTrack);
        $(".skip-next", $ui["now-playing"]).on("click", app.Player.nextTrack);

        // Cliques na linha do tempo
        $np.timeline.on("click", (event) => {
            let width = $(event.delegateTarget).width();
            let position = event.offsetX;
            let percent = position / width;

            let position_in_seconds = $player.duration * percent;
            app.Player.skipToPosition(position_in_seconds);
        });
    });

    // const updateTimeline

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.skipToPosition()
    const load = (song) => {
        $player.pause();
        $player.currentTime = 0;
        $player.src = song["file"];

        let length = duration($player.duration);
        $np.length.text(length);

        $player.play();
    };


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
    // app.Player.previousTrack()
    const previousTrack = () => {
        queue_position = (queue_position - 1 + queue.length) % queue.length;
        app.Player.load(queue[queue_position]);
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.nextTrack()
    const nextTrack = () => {
        queue_position = (queue_position + 1) % queue.length;
        app.Player.load(queue[queue_position]);
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////

    return {
        load,
        skipToPosition,
        play,
        pause,
        playPause,
        previousTrack,
        nextTrack
    };
})();

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
