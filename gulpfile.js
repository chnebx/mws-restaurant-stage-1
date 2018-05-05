const gulp = require('gulp');
const gulpUtil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const cssClean = require('gulp-clean-css');
const merge = require('merge-stream');
const browserSync = require('browser-sync').create();
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const babelify = require('babelify');
const buffer = require('vinyl-buffer');
const gulpif = require('gulp-if');
const htmlmin = require('gulp-htmlmin');

const commonSources = ['manifest.json'];
const htmlSources = ['index.html', 'restaurant.html', 'skeleton.html'];

let buildPath = 'builds/development';
let env = process.env.NODE_ENV || 'development';
let server;

if (env === 'development') {
    buildPath = 'builds/development';
    server = './builds/development';
} else if (env === 'production') {
    buildPath = 'builds/dist';
    server = './builds/dist';
}

gulp.task('serve', () => {
    browserSync.init({
        server: server,
        port: 5000
    });
});

gulp.task('scripts', () => {

    const mainScript = browserify('./js/main', {debug: true})
        .transform("babelify", {presets: ["babel-preset-env"]})
        .bundle()
        .pipe(source('index.js'))
        .pipe(buffer())
        .pipe(gulpif(env === 'development', sourcemaps.init({loadMaps: true})))
        .pipe(gulpif(env === 'production', uglify()))
        .on('error', gulpUtil.log)
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(gulp.dest(`${buildPath}/js`));

    const restaurantScript = browserify('./js/restaurant_info', {debug: true})
        .transform("babelify", {presets: ["babel-preset-env"]})
        .bundle()
        .pipe(source('restaurant.js'))
        .pipe(buffer())
        .pipe(gulpif(env === 'development', sourcemaps.init({loadMaps: true})))
        .pipe(gulpif(env === 'production', uglify()))
        .on('error', gulpUtil.log)
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(gulp.dest(`${buildPath}/js`));

    return merge(mainScript, restaurantScript);
});

gulp.task('scripts-watch', ['scripts'], (done) => {
    browserSync.reload();
    done();
});

gulp.task('css', () => {
    gulp.src('css/*.css')
        .pipe(gulpif(env === 'production', cssClean()))
        .pipe(gulp.dest(`${buildPath}/css`))
        .pipe(browserSync.stream())
});

gulp.task('common', ()=> {
    gulp.src(commonSources)
        .pipe(gulp.dest(`${buildPath}`));
});

gulp.task('sw', () => {
    gulp.src('sw.js')
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(gulpif(env === 'production', uglify()))
        .pipe(gulp.dest(`${buildPath}`));
})

gulp.task('html', () => {
    gulp.src(htmlSources)
        .pipe(gulpif(env === 'production', htmlmin({collapseWhitespace: true, minifyCSS: true})))
        .pipe(gulp.dest(`${buildPath}`));
})

gulp.task('images', () => {
    gulp.src('img/**/*', { base: 'img'})
        .pipe(gulp.dest(`${buildPath}/img`));
});

gulp.task('watch', ['serve'], () => {
    gulp.watch('js/*.js', ['scripts-watch']);
    gulp.watch('css/styles.css', ['css']);
    gulp.watch(htmlSources, ['html']);
    gulp.watch('sw.js', ['sw'])
        .on('change', browserSync.reload);
    gulp.watch(commonSources, ['common'])
        .on('change', browserSync.reload);
});

gulp.task('default', ['html', 'common', 'images', 'sw', 'scripts', 'css', 'watch', 'serve']);