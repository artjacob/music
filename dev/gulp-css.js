////////////////////////////////////////////////////////////////////////////////////////////////////
// gulp / css //////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////
const gulp = require("gulp");
const browserSync = require("browser-sync").get("gulp");
const log = require("fancy-log");
const color = require("ansi-colors");
const plumber = require("gulp-plumber");
const sourcemaps = require("gulp-sourcemaps");
const config = require("./gulp-config.js");

// Módulos específicos para CSS
const sass = require("gulp-sass");
const groupMediaQueries = require("gulp-group-css-media-queries");
const cssnano = require("gulp-cssnano");

let tasks = { };

////////////////////////////////////////////////////////////////////////////////////////////////////

// Watch
tasks["watch"] = function watchCSS(done) {
    gulp.watch(config["css"]["watch"], { "cwd": config["css"]["dir"] }, tasks["stage"]);
    done();
};

// Stage
tasks["stage"] = function stageCSS(done) {
    gulp.src(config["css"]["source"])
        .pipe(plumber())
        .pipe(sourcemaps.init())

        .pipe(sass({ outputStyle: "expanded" }))
        .pipe(groupMediaQueries())
        .pipe(cssnano({ autoprefixer: { add: true, browsers: ["> 1%"] }, zindex: true }))

        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config["css"]["destination"]["development"], { mode: "0644" }))
        .pipe(browserSync.stream());

    log(color.cyan("CSS !!"));
    done();
};

module.exports = tasks;
