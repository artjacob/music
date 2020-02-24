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

// Módulos específicos para JS
const concat = require("gulp-concat");
const babel = require("gulp-babel");
const uglify = require("gulp-uglify");
const fs = require("fs-extra");

let tasks = { };

////////////////////////////////////////////////////////////////////////////////////////////////////

// Watch
tasks["watch"] = function watchJS(done) {
    gulp.watch(config["js"]["watch"], { "cwd": config["js"]["dir"], "ignoreInitial": false }, tasks["stage"]);
    done();
};

// Stage
tasks["stage"] = function stageJS(done) {
    let source = fs.readJsonSync(config["js"]["source"][0]).map(file => "./source/js/" + file);

    gulp.src(source)
        .pipe(plumber())
        .pipe(sourcemaps.init())

        .pipe(concat("music.js"))
        .pipe(babel({ presets: ["@babel/env"] }))

        .pipe(sourcemaps.write())
        .pipe(gulp.dest(config["js"]["destination"]["development"], { mode: "0644" }));

    log(color.yellow("JS !!"));
    done();
};

module.exports = tasks;
