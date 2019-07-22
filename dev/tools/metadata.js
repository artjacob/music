const fs = require("fs-extra");
const mm = require("music-metadata");

mm.parseFile("./../../source/data/files/11 A Hazy Shade of Winter.m4a", { "native": false }).then((metadata) => {
    fs.outputJsonSync("metadata.json", metadata, { "spaces": "\t" });
    fs.outputFileSync("cover.png", metadata["common"]["picture"][0]["data"], "binary");
});
