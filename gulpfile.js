const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync').create();
const proxy = require('http-proxy-middleware');

let apiServer = null;

gulp.task('reload:dev', function() {
    browserSync.reload();
});

gulp.task('start:api', (cb) => {
    apiServer = nodemon({
        script: 'dev-server.js'
    });
    cb();
});

gulp.task('watch', function() {
    return gulp.watch('./src/**/*', ['reload:dev']);
});

gulp.task('serve', ['watch'], (cb) => {
    browserSync.init({
        server: {
            port: 3000,
            baseDir: './src'
        }
    });
    cb();
});

process.on('exit', function () {
    // In case the gulp process is closed (e.g. by pressing [CTRL + C]) stop both processes
    apiServer.kill();
});


gulp.task('default', ['serve','start:api']);