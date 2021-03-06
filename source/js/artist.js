////////////////////////////////////////////////////////////////////////////////////////////////////
// artist //////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////

app.Artist = (() => {

    ////////////////////////////////////////////////////////////////////////////////////////////////
    // app.Artist.load()
    const load = (artist_id) => {
        $.get("data/artists/" + artist_id + ".json").done((response) => {
            let artist = response;
            let $artist = __render("artist", artist);

            // Álbuns
            let albums = artist["albums"];
            let $albums = $(".albums", $artist);

            albums.forEach((album) => {
                album["cover-art"] = "background-image: url('" + album["cover"] + "')";
                let $album = __render("artist-album", album).appendTo($albums);
            });

            // Hits
            let hits = artist["hits"];
            let $hits = $(".hits", $artist);

            hits.forEach((hit) => {
                hit["formatted-length"] = duration(hit["length"]);
                let $hit = __render("artist-hit", hit).appendTo($hits);
            });

            // Coloca na tela
            $ui["library"].empty().append($artist);
        });
    };


    ////////////////////////////////////////////////////////////////////////////////////////////////

    return {
        load
    };
})();
