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
const webp = require('gulp-webp');
const compression = require("compression");
const gzip = require("gulp-gzip");
const gzipStaticMiddleware = require('connect-gzip-static')('./builds/dist');
const postCss = require("gulp-postcss");
const unCss = require("postcss-uncss");

const commonSources = ['manifest.json'];
const htmlSources = ['index.html', 'restaurant.html', 'skeleton.html'];

let buildPath = 'builds/development';
let env = process.env.NODE_ENV || 'development';
let serverDir;

if (process.argv[2] === '-production') {
    env = "production";
}

if (env === 'development') {
    buildPath = 'builds/development';
    serverDir = './builds/development';
} else if (env === 'production') {
    buildPath = 'builds/dist';
    serverDir = './builds/dist';
}

function contentEncodingMiddleware(req, res, next) {
    if (req._parsedUrl.pathname.match(/index.js/) || 
        req._parsedUrl.pathname.match(/restaurant.js/) || 
        req._parsedUrl.pathname.match(/styles.css/) || 
        req._parsedUrl.pathname.match(/.html/)
    ){
        res.setHeader("Content-Encoding", "gzip");
    }
    next();
}

gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: serverDir,
            files: ['builds/dist/**/*.{html, js, css, gz}']
        },
        port: 5000
    }, function(err, bs){
        if (env === 'production') {
            process.stdout.write("true it should launch the middleware");
            bs.addMiddleware("*",contentEncodingMiddleware, {
                override: true
            });
            bs.addMiddleware("*", gzipStaticMiddleware, {
                override: true
            })
        }
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
        .pipe(gulpif(env === 'production', gzip()))
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
        .pipe(gulpif(env === 'production', gzip()))
        .on('error', gulpUtil.log)
        .pipe(gulpif(env === 'development', sourcemaps.write()))
        .pipe(gulp.dest(`${buildPath}/js`));

    return merge(mainScript, restaurantScript);
});

gulp.task('scripts-watch', ['scripts', 'sw-utility'], (done) => {
    browserSync.reload();
    done();
});

gulp.task('css', () => {
    gulp.src('css/*.css')
        .pipe(gulpif(env === 'production', cssClean()))
        // .pipe(gulpif(env == "production", 
        //     postCss([unCss({
        //         html: ["builds/dist/index.html", "builds/dist/restaurant.html"]
        //     })])
        // ))
        .pipe(gulpif(env === 'production', gzip()))
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

gulp.task('sw-utility', () => {
    gulp.src(['js/idb.js', 'js/sw-utility.js'])
        .pipe(gulp.dest(`${buildPath}/js`));
})

gulp.task('html', () => {
    gulp.src(htmlSources)
        .pipe(gulpif(env === 'production', htmlmin({collapseWhitespace: true, minifyCSS: true})))
        .pipe(gulpif(env === 'production', gzip()))
        .pipe(gulp.dest(`${buildPath}`));
})

gulp.task('images', () => {
    gulp.src('img/**/*', { base: 'img'})
        .pipe(gulp.dest(`${buildPath}/img`));
});

gulp.task('webp', () => {
    gulp.src('img/photos/small/*.jpg')
        .pipe(webp())
        .pipe(gulp.dest('img/photos/small/'));
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

gulp.task('default', ['html', 'common', 'images', 'sw', 'sw-utility', 'scripts', 'css', 'watch', 'serve']);
