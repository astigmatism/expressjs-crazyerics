var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var jscs = require('gulp-jscs');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var uglify = require('gulp-uglify');
var minify = require('gulp-minify');
var cssnano = require('gulp-cssnano');
var sourcemaps = require('gulp-sourcemaps');
var pump = require('pump');

//ideally we are watching all javacript files inside this project
var paths = [
    './public/javascripts/*.js'
];

var DEST = './public/build/';

var jshintConfig = {};

var watcher = gulp.watch(paths, {debounceDelay: 1000}, ['watch']);

gulp.task('default', function() {
    console.log('now listening to all javascript files');
});

var changedFiles = '';

watcher.on('change', function(event) {
    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    changedFiles = event.path;
});

gulp.task('watch', function() {
    //run these sequences in this order:
    //runSequence('jscsfixjustwhitespace', 'jscs', 'lint', function() {
    runSequence('jscs', 'lint', 'minify-css', 'uglify', function() {
        return;
    });
});

gulp.task('uglify', function(callback) {
    pump([
        gulp.src('./public/javascripts/*.js'),
        sourcemaps.init(),
        concat('build.js'),
        uglify(),
        sourcemaps.write('./'),
        gulp.dest(DEST)
    ], callback);
});

// gulp.task('minify', function(callback) {
//     pump([
//         gulp.src('./public/javascripts/*.js'),
//         sourcemaps.init(),
//         concat('build.js'),
//         minify(),
//         sourcemaps.write('./'),
//         gulp.dest(DEST)
//     ], callback);
// });

gulp.task('jscsfixjustwhitespace', function(callback) {
    // See here for why I specified a base: http://stackoverflow.com/a/24412960/3595355
    //return gulp.src(js_src, {base: './'})
    pump([
        gulp.src(changedFiles, {base: './'}),
        jscs({
            fix: true,
            // The following won't work until the issue is fixed on github.
            // https://github.com/jscs-dev/node-jscs/pull/1479
            disallowTrailingWhitespace: true,
            requireLineFeedAtFileEnd: true,
            validateIndentation: 4
        }),
        gulp.dest('./')
    ], callback);
});

gulp.task('lint', function(callback) {
    pump([
        gulp.src(changedFiles),
        jshint(jshintConfig),
        jshint.reporter(stylish)
    ], callback);
});

function jscsErrorHandler(error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('jscs', function(callback) {
    pump([
        gulp.src(changedFiles),
        jscs(),
        jscs.reporter()
    ], callback);
});

gulp.task('closure', function() {
  return gulp.src('./public/javascripts/*.js')
    .pipe(closureCompiler({
      compilerPath: './compiler.jar',
      fileName: 'build.js',
      compilation_level: 'SIMPLE_OPTIMIZATIONS',
    }))
    .pipe(gulp.dest('dist'));
  // return gulp.src('./public/javascripts/*.js')
  //   .pipe(closure({
  //       language: 'ECMASCRIPT5',
  //       compilation_level: 'SIMPLE_OPTIMIZATIONS'
  //   }))
  //   .pipe(gulp.dest(DEST));
});

gulp.task('minify-css', function(callback) {
    pump([
        gulp.src('./public/stylesheets/*.css'),
        cssnano(),
        concat('style.min.css'),
        gulp.dest(DEST)
    ], callback);
});
