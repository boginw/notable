'use strict';

var gulp = require('gulp');
var less = require('gulp-less');
var watch = require('gulp-watch');
var batch = require('gulp-batch');
var ts = require('gulp-typescript');
var plumber = require('gulp-plumber');
var jetpack = require('fs-jetpack');
var bundle = require('./bundle');
var utils = require('./utils');
var runsequence = require('run-sequence');
var path = require('path');
var tslint = require("gulp-tslint");
// var ts = require('typescript');
var pngToIco = require('png-to-ico');
var fs = require('fs');

var projectDir = jetpack;
var srcDir = jetpack.cwd('./src');
var distDir = jetpack.cwd('./dist');
var destDir = jetpack.cwd('./app');


gulp.task('lint', () => {
	// ESLint ignores files with "node_modules" paths.
	// So, it's best to have gulp ignore the directory as well.
	// Also, Be sure to return the stream from the task;
	// Otherwise, the task may end before the stream has finished.
	return gulp.src(['src/**/*.ts', '!node_modules/**'])
		.pipe(tslint({
			configuration: path.join(__dirname,"../.tslintrc.json"),
            formatter: "verbose"
        }))
        .pipe(tslint.report())
});

gulp.task('bundle', function () {
	let modules = jetpack.list(srcDir.path(path.join('modules', 'editor')));
	let bundles = [
		bundle(distDir.path('background.js'), destDir.path('background.js')),
		bundle(distDir.path('app.js'), destDir.path('app.js')),
	];

	return Promise.all(bundles);
});

var tsProject = ts.createProject('tsconfig.json');

gulp.task('ts', function () {
	var tsResult = gulp.src('src/**/*.ts')
		.pipe(tsProject());

	return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('less', function () {
	return gulp.src(srcDir.path('stylesheets/main.less'))
		.pipe(plumber())
		.pipe(less())
		.pipe(gulp.dest(destDir.path('stylesheets')));
});

gulp.task('environment', function () {
	var configFile = 'config/env_' + utils.getEnvName() + '.json';
	projectDir.copy(configFile, destDir.path('env.json'), { overwrite: true });
});

gulp.task('watch', function () {
	var beepOnError = function (done) {
		return function (err) {
			if (err) {
				utils.beepSound();
			}
			done(err);
		};
	};

	watch('src/**/*.ts', batch(function (events, done) {
		runsequence('ts', 'bundle', done);
	}));
	watch('src/**/*.less', batch(function (events, done) {
		gulp.start('less', beepOnError(done));
	}));
});

gulp.task('logo', function(){
	let source = jetpack.cwd('./build/icons');
	let build = jetpack.cwd('./build/').path();
	let dist = jetpack.cwd('./app/images/').path();

	let firstIcon = path.join(source.path(),source.list()[0]);
	
	pngToIco(firstIcon)
		.then(buf => {
			fs.writeFileSync(path.join(build, 'icon.ico'), buf);
			fs.writeFileSync(path.join(dist, 'logo.ico'), buf);
		})
		.catch(console.error);

	fs.createReadStream(firstIcon).pipe(fs.createWriteStream(path.join(dist, 'logo.png')));
});

gulp.task('build', runsequence('lint', 'ts', 'bundle', 'less', 'environment','logo'));
