const fs = require("fs-extra");

let songs = fs.readJsonSync("songs.json");
let artists = { };
let ordered = [ ];

const sortingTitle = (string) => {
    return string.toLowerCase().replace(/^the /, "");
};

songs.forEach((song) => {
    let artist = song["artist"];
    let sorting = sortingTitle(song["artist"]);

    if (!artists[sorting]) {
        artists[sorting] = artist;
    }
});

Object.keys(artists).sort().forEach((sorting) => {
    ordered.push(artists[sorting]);
});

fs.outputJsonSync("artists.json", ordered, { "spaces": "\t" });
