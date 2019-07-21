////////////////////////////////////////////////////////////////////////////////////////////////////
// commands ////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

let commands = [
    {
        "title": "Play/Pause",
        "shortcut": ["k", "space"],
        "function": () => {
            app.Player.playPause();
        }
    },
    {
        "title": "Música anterior",
        "shortcut": [","],
        "function": () => {
            app.Player.previousTrack();
        }
    },
    {
        "title": "Próxima música",
        "shortcut": ["."],
        "function": () => {
            app.Player.nextTrack();
        }
    }
];

commands.forEach((command) => {
    command["shortcut"].forEach((shortcut) => {
        Mousetrap.bind(shortcut, command["function"]);
    });
});

// - J: volta 10 segundos
// - L: avança 10 segundos
// - R: repeat
// - S: shuffle
// - M: mudo

// # Navegação
// - g f: favoritos
// - g l: biblioteca
// - g p: playlists
