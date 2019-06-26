////////////////////////////////////////////////////////////////////////////////////////////////////
// gulp / html /////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const gulp = require("gulp");
const browserSync = require("browser-sync").get("gulp");
const log = require("fancy-log");
const color = require("ansi-colors");
const plumber = require("gulp-plumber");
const sourcemaps = require("gulp-sourcemaps");
const rename = require("gulp-rename");
const config = require("./gulp-config.js");

// Módulos específicos para HTML
const pug = require("gulp-pug");
const inline = require("gulp-inline-source");

let tasks = { };

////////////////////////////////////////////////////////////////////////////////////////////////////

// Watch
tasks["watch"] = function watchHTML(done) {
    gulp.watch(config["html"]["watch"], { "cwd": config["html"]["dir"] }, tasks["stage"]);
    done();
};

// Stage
tasks["stage"] = function stageHTML(done) {
    for (let channel in config["html"]["destination"]) {
        gulp.src(config["html"]["source"])
            .pipe(plumber())

            .pipe(pug({
                "pretty": (channel === "development"? " " : false),
                "locals": {
                    "env": channel
                }
            }))

            .pipe(inline())
            .pipe(rename("index.html"))
            .pipe(gulp.dest(config["html"]["destination"][channel], { mode: "0644" }));
    }

    log(color.magenta("HTML !!"));
    done();
};

module.exports = tasks;
