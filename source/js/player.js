////////////////////////////////////////////////////////////////////////////////////////////////////
// player //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

let queue = [
    {
        "title": "Captain Calvin (Original Mix)",
        "artist": "Louk",
        "album": "Chillhop Essentials Winter 2018",
        "length": 140,
        "cover": "https://lh3.googleusercontent.com/JJAK0mX_p5KLf9_efSEr7l2o2oAGyCn7b8-pOsfp8_jf02uvJUIJ1pDtDZx1JsJAfM5YOe2BIEA",
        "file": "/data/files/14 Captain Calvin (Original Mix).mp3"
    },
    {
        "title": "Tico Tico",
        "artist": "Oscar Peterson",
        "album": "Ultimate Jazz Collections",
        "length": 180,
        "cover": "https://lh5.ggpht.com/hwEKMItKyFyHIgNl28CfbBr-RYLvNhDUj_SFe757m_gH2yNsoRXYmXgWI02tkAoVLKCNIihb",
        "file": "/data/files/30 Tico Tico.m4a"
    }
];

let $np;

app.Player = (() => {
    let $player = document.createElement("audio");
    let queue_position = 0;

    $(function() {
        $np = $(".now-playing");
        $np.position = $(".now-playing .position");
        $np.length = $(".now-playing .length");
        $np.timeline = $(".now-playing .bar");
        $np.elapsed = $(".now-playing .elapsed");

        $np.song = $(".now-playing .song");
        $np.artist = $(".now-playing .artist");
        $np.album = $(".now-playing .album");
        $np.cover = $(".now-playing .cover");

        $player.addEventListener("timeupdate", (event) => {
            let position = duration($player.currentTime);
            $np.position.text(position);

            let percent = $player.currentTime / $player.duration * 100;
            $np.elapsed.css("width", percent + "%");

            // console.log(position_is_seconds, human_position);
        });

        // Define o tempo de duração quando uma música é carregada música
        $player.addEventListener("loadedmetadata", () => {
            let length = duration($player.duration);
            $np.length.text(length);
        });

        $ui["now-playing"] = $(".now-playing");
        $(".play-pause", $ui["now-playing"]).on("click", app.Player.playPause);
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

        // Carrega a primeira música da fila
        app.Player.load(queue[queue_position]);
    });

    // const updateTimeline

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.skipToPosition()
    const load = (song) => {
        // Pausa a reprodução, reseta o tempo e carrega a nova música
        app.Player.pause();
        $player.currentTime = 0;
        $player.src = song["file"];

        // Atualiza as informações sobre a música em reprodução
        $np.song.text(song["title"]);
        $np.artist.text(song["artist"]);
        $np.album.text(song["album"]);
        $np.cover.css("background-image", "url('" + song["cover"] + "')");

        // Atualiza dados da Media Session API
        if ("mediaSession" in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                "title": song["title"],
                "artist": song["artist"],
                "album": song["album"],
                "artwork": [
                    {
                        "src": song["cover"],
                        "sizes": "512x512",
                        "type": "image/png"
                    }
                ]
            });
        }

        // Inicia a reprodução
        app.Player.play();
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
        $np.removeClass("-state--paused").addClass("-state--playing");
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.pause()
    const pause = () => {
        $player.pause();
        $np.removeClass("-state--playing").addClass("-state--paused");
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Player.playPause()
    const playPause = () => {
        if ($player.paused) {
            app.Player.play();
        } else {
            app.Player.pause();
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
    navigator.mediaSession.setActionHandler("play", app.Player.play);
    navigator.mediaSession.setActionHandler("pause", app.Player.pause);
    // navigator.mediaSession.setActionHandler("seekbackward", function () { });
    // navigator.mediaSession.setActionHandler("seekforward", function () { });
    navigator.mediaSession.setActionHandler("previoustrack", app.Player.previousTrack);
    navigator.mediaSession.setActionHandler("nexttrack", app.Player.nextTrack);
}
