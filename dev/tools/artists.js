const fs = require("fs-extra");

let songs = fs.readJsonSync("songs.json");
let artists = [ ];

songs.forEach((song) => {
    let artist = song["artist"];

    if (!artists.includes(artist)) {
        artists.push(artist);
    }
});

artists.sort();

fs.outputJsonSync("artists.json", artists, { "spaces": "\t" });
