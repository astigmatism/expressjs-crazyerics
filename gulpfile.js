var gulp = require('gulp');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
//var rename = require('gulp-rename');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
//var minify = require('gulp-minify');
var minifyCSS = require('gulp-csso');
var sourcemaps = require('gulp-sourcemaps');
var pump = require('pump');

//ideally we are watching all javacript files inside this project
var paths = [
    './public/javascripts/*.js',
    './public/javascripts/*/*.js'
];

var DEST = './public/build/';

var jshintConfig = {};

var changedFiles = '';

function runWatchTasks(done) {
    //run these sequences in this order:
    // JSCS has been removed because its abandoned dependency tree carries critical alerts.
    return gulp.series('lint', 'minify-css', 'uglify')(done);
}

gulp.task('default', function(done) {
    var watcher = gulp.watch(paths, { delay: 1000 });

    watcher.on('change', function(path) {
        console.log('File ' + path + ' was changed, running tasks...');
        changedFiles = path;
        runWatchTasks(function(err) {
            if (err) {
                console.error(err);
            }
        });
    });

    watcher.on('add', function(path) {
        console.log('File ' + path + ' was added, running tasks...');
        changedFiles = path;
        runWatchTasks(function(err) {
            if (err) {
                console.error(err);
            }
        });
    });

    console.log('now listening to all javascript files');
    done();
});

gulp.task('watch', runWatchTasks);

gulp.task('uglify', function(callback) {
    pump([
        gulp.src(['./public/javascripts/**/*.js', '!./public/javascripts/dev/*.js']),
        sourcemaps.init(),
        concat('app.min.js'),
        uglify(),
        //sourcemaps.write('./'),
        gulp.dest(DEST)
    ], callback);
});

// gulp.task('minify', function(callback) {
//     pump([
//         gulp.src('./public/javascripts/*.js'),
//         sourcemaps.init(),
//         concat('app.min.js'),
//         minify(),
//         sourcemaps.write('./'),
//         gulp.dest(DEST)
//     ], callback);
// });

gulp.task('jscsfixjustwhitespace', function(callback) {
    // Retained as a no-op compatibility task for older local workflows.
    callback();
});

gulp.task('lint', function(callback) {
    pump([
        gulp.src(changedFiles || paths),
        jshint(jshintConfig),
        jshint.reporter(stylish)
    ], callback);
});

gulp.task('jscs', function(callback) {
    // Retained as a no-op compatibility task for older local workflows.
    callback();
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
        minifyCSS(),
        concat('style.min.css'),
        gulp.dest(DEST)
    ], callback);
});
