const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, 'node_modules/electron/dist/ffmpeg.dll');
const destination = path.join(__dirname, 'dist/win-unpacked/ffmpeg.dll');

if (fs.existsSync(source)) {
  fs.copyFileSync(source, destination);
  console.log('ffmpeg.dll copiado exitosamente.');
} else {
  console.error('No se encontró ffmpeg.dll en el directorio de Electron.');
}
