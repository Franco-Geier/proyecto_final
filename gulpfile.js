const { src, dest, watch, parallel, series } = require('gulp');

// CSS
const sass = require('gulp-sass')(require('sass'));
const plumber = require('gulp-plumber');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const postcss = require('gulp-postcss');
const sourcemaps = require('gulp-sourcemaps');

// Imagenes
const avif = require('gulp-avif');
const notify = require('gulp-notify');

// Javascript
const terser = require('gulp-terser-js');
const concat = require('gulp-concat');
const rename = require('gulp-rename');

// Paths
const paths = {
    scss: 'src/scss/**/*.scss',
    js: 'src/js/**/*.js',
    imagenes: 'src/img/**/*'
}


// Usar import dinámico para gulp-imagemin y sus plugins integrados
async function imagenes() {
    const imagemin = (await import('gulp-imagemin')).default;
    const mozjpeg = (await import('imagemin-mozjpeg')).default;
    const optipng = (await import('imagemin-optipng')).default;

    const opciones = {
        plugins: [
            mozjpeg({ quality: 75, progressive: true }),  // Optimización para JPEG
            optipng({ optimizationLevel: 5 }),  // Optimización para PNG
        ]
    };
    return src(paths.imagenes)
        .pipe(imagemin(opciones.plugins))  // Aplicar optimizadores de gulp-imagemin
        .pipe(dest('build/img'))
        .pipe(notify({ message: 'Imagen Completada' }));
}


async function versionWebp() {
    const webp = (await import('gulp-webp')).default;
    const opciones = {
        quality: 50
    };
    return src(paths.imagenes)
        .pipe(webp(opciones))
        .pipe(dest('build/img'))
        .pipe(notify({ message: 'Imagen Completada' }));
}


function versionAvif() {
    const opciones = {
        quality: 50
    };
    return src(paths.imagenes)
        .pipe(avif(opciones))
        .pipe(dest('build/img'))
        .pipe(notify({ message: 'Imagen Completada' }));
}


function css() {
    return src(paths.scss) // Identificar el archivo SASS
        .pipe(plumber({ errorHandler: handleError }))  // Manejo de errores con función personalizada
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'expanded'}))  // Compilar SASS a CSS
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(sourcemaps.write("."))
        .pipe(dest("build/css"));  // Almacenar en la carpeta build
}


function javascript() {
    return src(paths.js)
        .pipe(sourcemaps.init())
        .pipe(concat('bundle.js'))
        .pipe(terser())
        .pipe(sourcemaps.write("."))
        .pipe(rename({ suffix: '.min' }))
        .pipe(dest('build/js'));
}


function handleError(error) {
    console.error('Error en Gulp:', error.toString());
    this.emit('end');  // Permite que Gulp continúe
}


function dev() {
    watch(paths.scss, css);
    watch(paths.js, javascript);
}


// Convertir imagenes solo cuando se necesite
const processImages = parallel(imagenes, versionWebp, versionAvif);


// Exportar tareas
exports.css = css;
exports.js = javascript;
exports.imagenes = imagenes;
exports.versionWebp = versionWebp;
exports.versionAvif = versionAvif;
exports.processImages = processImages;
exports.dev = series(css, javascript, dev);  // Tarea para vigilar cambios en CSS y JS