var gulp       = require('gulp');
var browserify = require('browserify');
//var browserify = require('gulp-browserify');
var babelify   = require('babelify');
var source     = require('vinyl-source-stream');
var vueify     = require('vueify');
var replace    = require('gulp-replace');
var electronInstaller = require('electron-winstaller');
var packager = require('electron-packager')

const browserConfig = {
    entries: './renderer.js',
    extension: ['.js', '.vue'],
    insertGlobals: false,
    detectGlobals: true,
    ignoreMissing: true,
    node: true
};

gulp.task("build", ()=>{
	packager({
	    platform: "win32",
	    dir: ".",
	}, function done_callback (err, appPaths) {
		resultPromise = electronInstaller.createWindowsInstaller({
		    appDirectory: './build/win32',
	    	outputDirectory: './release',
		    authors: 'Notable Ink.',
		    noMsi: true,
		    setupExe: 'notable_setup.exe',
		    exe: 'notable.exe'
		  });

		resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
	});

});


gulp.task("browserify", ()=>{
	return browserify(browserConfig)
		.transform(vueify)
		.transform(babelify)
		.bundle()
		.pipe(source('bundle.js'))
		.pipe(gulp.dest('app/js'))
		.on('error', console.log);
});

gulp.task("watch", ()=>{
	gulp.watch(['**/*.js',"!node_modules/*"],["browserify"]);
});

gulp.task('default', ['browserify'], function() {
    return console.log("Completed!");
});

/*
gulp.task('default', function(){
    gulp.src('renderer.js')
        .pipe(browserify({ transform: ['vueify', 'babelify', 'aliasify'] }))
        .pipe(replace('require', 'requireClient'))
        .pipe(replace('nequire', 'require'))
		.pipe(gulp.dest('./app/js'))
});
*/

/*gulp.task('default', function () {
	gulp.src('renderer.js')
		.pipe(browserify({ transform: ['vueify', 'babelify', 'aliasify'] }))
		.pipe(gulp.dest('./app/js/renderer.js'))
})*/


/*var gulp       = require('gulp');
var browserify = require('browserify');
var babelify   = require('babelify');
var source     = require('vinyl-source-stream');
var vueify     = require('vueify');

const browserConfig = {
    entries: './renderer.js',
    extension: ['.js', '.vue'],
    ignoreMissing: false,
    detectGlobals: false,
    bare: true
};

gulp.task("browserify", ()=>{
	return browserify('./renderer.js')
	    .transform(vueify, {babel: {presets: ["es2015"], plugins: ["transform-runtime"]}})
	    .transform(babelify, {presets: ["es2015"], extensions: ['.js', '.vue']})
	    .bundle()
		.pipe(source('bundle.js'))
		.pipe(gulp.dest('app/js'));
});

/*gulp.task("browserify", ()=>{
	return browserify('./renderer.js')
		.transform(vueify)
		.transform(babelify)
		.bundle()
		.pipe(source('bundle.js'))
		.pipe(gulp.dest('app/js'));
});*/

//gulp.task("watch", ()=>{
//	gulp.watch(['**/*.vue','**/*.js',"!node_modules/*"],["browserify"]);
//});