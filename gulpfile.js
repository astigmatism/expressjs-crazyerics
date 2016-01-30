var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var jscs = require('gulp-jscs');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var concat = require('gulp-concat');
var runSequence = require('run-sequence');
var closure = require('gulp-closure-compiler-service');
var cssnano = require('gulp-cssnano');

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
    runSequence('jscs', 'lint', 'minify-css', function() {
        return;
    });
});

gulp.task('jscsfixjustwhitespace', function() {
    // See here for why I specified a base: http://stackoverflow.com/a/24412960/3595355
    //return gulp.src(js_src, {base: './'})
    return gulp.src(changedFiles, {base: './'})
        .pipe(jscs({
            fix: true,
            // The following won't work until the issue is fixed on github.
            // https://github.com/jscs-dev/node-jscs/pull/1479
            disallowTrailingWhitespace: true,
            requireLineFeedAtFileEnd: true,
            validateIndentation: 4
        }))
        .on('error', jscsErrorHandler)
        .pipe(gulp.dest('./'));
});

gulp.task('lint', function() {
  var result = gulp.src(changedFiles)
    .pipe(jshint(jshintConfig))
    .pipe(jshint.reporter(stylish))
});

function jscsErrorHandler(error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('jscs', function() {
  return gulp.src(changedFiles)
    .pipe(jscs())
    .pipe(jscs.reporter());
});

//use closure instead
gulp.task('mini', function() {
  return gulp.src(changedFiles)
    // This will output the non-minified version
    //.pipe(gulp.dest(DEST))
    // This will minify and rename to foo.min.js
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulp.dest(DEST));
});

gulp.task('closure', function() {
  return gulp.src('./public/javascripts/*.js')
    .pipe(closure({
        language: 'ECMASCRIPT5',
        compilation_level: 'SIMPLE_OPTIMIZATIONS'
    }))
    .pipe(gulp.dest(DEST));
});

gulp.task('minify-css', function() {
  return gulp.src('./public/stylesheets/*.css')
    .pipe(cssnano())
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest(DEST));
});
