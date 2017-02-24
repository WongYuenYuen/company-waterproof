/**
 *   前端资源构建
 *   
 */

var gulp = require('gulp');
var connect = require('gulp-connect');
var uglify = require('gulp-uglify'); //压缩js
var minify = require('gulp-minify-css'); //压缩css
var sass = require('gulp-sass'); //编译sass
var livereload = require('gulp-livereload'); //自动刷新
var imagemin = require('gulp-imagemin'); //压缩图片
var pngquant = require('imagemin-pngquant'); //压缩png图片
var plumber = require('gulp-plumber'); //catch出错
var rename = require('gulp-rename'); //专门改名
var cssbeautify = require('gulp-cssbeautify');
var rev = require('gulp-rev'); //改版本号
var through = require('through2'); //任务
var rimraf = require('rimraf'); //删目录 删文件
var path = require('path'); //node内置模块 
var revCollector = require('gulp-rev-collector'); //该版本
var revOutdated = require('gulp-rev-outdated'); //该版本
var concat = require('gulp-concat'); //合并 js 文件
var spritesmith = require('gulp.spritesmith');
var jade = require('gulp-jade'); //jade模板引擎



var basePath = './';
var path = {

    scss: {
        srcPath: basePath + 'scss/**/*.scss',
        desPath: basePath + 'css/'
    },
    js: {
        srcPath: basePath + 'js/**/*.js',
        desPath: ''
    },
    images: {
        srcPath: basePath + 'images/*',
        desPath: ''
    },
    html: {
        srcPath: basePath + 'html/**/*.html',
        desPath: ''
    },
    jade: {
        srcPath: basePath + 'jade/**/*.jade',
        desPath: ''
    },
}
gulp.task('webserver', function() {
    connect.server();
});

gulp.task('templates', function() {
    var YOUR_LOCALS = {};

    gulp.src('./jade/*.jade')
        .pipe(jade({
            locals: YOUR_LOCALS,
            pretty: true
        }))
        .pipe(gulp.dest('./html/'))
        .pipe(livereload());
});
/** sass编译 */
gulp.task('sass', function() {
    gulp.src('./sass/*.scss')
        .pipe(plumber())
        .pipe(sass().on('error', sass.logError))
        .pipe(cssbeautify())
        .pipe(gulp.dest('./css/'))
        .pipe(livereload());

});

/** 压缩图片 */
gulp.task('minifyImage', function() {
    gulp.src([path.images.srcPath])
        .pipe(plumber())
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(path.images.srcPath))
});

gulp.task('sprite', function() {
    var spriteData = gulp.src(path.images.srcPath + '/*.png').pipe(spritesmith({
        imgName: './sprite.png',
        cssName: './sprite.css'
    }));
    return spriteData.pipe(gulp.dest(path.images.srcPath));
});
/** 自动刷新页面 */
gulp.task('livereload', function() {
    livereload.listen();
    gulp.watch('./sass/*.scss', ['sass']);
    gulp.watch('./jade/*.jade', ['templates']);
    gulp.watch([path.html.srcPath, path.scss.srcPath, path.js.srcPath, path.jade.srcPath]).on('change', livereload.changed);

});

/** css加版本号防止缓存 */
gulp.task('cssVersion', function() {
    gulp.src('./src/static/css/**/*.css')
        .pipe(plumber())
        .pipe(rev())
        .pipe(minify())
        .pipe(gulp.dest('./release/css'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./release/rev/css'))
});

/** js加版本号防止缓存 */
gulp.task('jsVersion', function() {
    gulp.src('./src/static/js/**/*.js')
        .pipe(plumber())
        .pipe(rev())
        .pipe(uglify())
        .pipe(gulp
            .dest('./release/js'))
        .pipe(rev.manifest())
        .pipe(gulp.dest('./release/rev/js'))
});

/** 同步html里加上版本号的静态资源 */
gulp.task('syncVersion', ['cssVersion', 'jsVersion', 'minifyImage'], function() {
    gulp.src(['./release/rev/**/*.json', './src/html/**/*.html'])
        .pipe(revCollector({
            replaceReved: true,
            dirReplacements: {
                '/': './release'
            }
        }))
        .pipe(gulp.dest('./release/html'))
});


function cleaner() {
    return through.obj(function(file, enc, cb) {
        rimraf(path.resolve((file.cwd || process.cwd()), file.path), function(err) {
            if (err) {
                this.emit('error', new gutil.PluginError('Cleanup old files', err));
            }
            this.push(file);
            cb();
        }.bind(this));
    });
};

gulp.task('clean', function() {
    gulp.src(['release/**/*.*'], {
            read: false
        })
        .pipe(revOutdated(1))
        .pipe(cleaner());
    return;
});

/** 定时任务 */
//@todo

/** 开发环境 */
gulp.task('dev', ['templates', 'webserver', 'sass', 'livereload']);


/** 生产环境 */
gulp.task('build', ['syncVersion']);
