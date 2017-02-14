const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync').create();
const proxy = require('http-proxy-middleware');


gulp.task('reload:dev', function() {
    browserSync.reload();
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

gulp.task('default', ['serve']);