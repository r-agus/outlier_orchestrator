const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const srcDir = path.join(__dirname, 'src', 'views');
const distDir = path.join(__dirname, 'dist');
const inputFile = path.join(srcDir, 'dashboard.ejs');
const outputFile = path.join(distDir, 'index.html');

// Crear la carpeta dist si no existe
if (!fs.existsSync(distDir)) {
  console.log('Creando carpeta dist...');
  fs.mkdirSync(distDir, { recursive: true });
}

// Renderizar EJS a HTML
console.log('Renderizando dashboard.ejs en HTML...');
ejs.renderFile(inputFile, {}, {}, (err, html) => {
  if (err) {
    console.error('Error al renderizar la plantilla EJS:', err);
    process.exit(1);
  }

  // Guardar el HTML en dist/index.html
  console.log('Guardando HTML en dist/index.html...');
  fs.writeFileSync(outputFile, html);

  console.log('Proceso de build completado exitosamente!');
  console.log(`El archivo HTML ha sido generado en: ${outputFile}`);
});

// Copiar archivos estáticos necesarios desde public/ a dist/ (si existen)
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {  
  const files = fs.readdirSync(publicDir);
  
  files.forEach(file => {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(distDir, file);
    
    // Verificar si es un archivo (no una carpeta)
    if (fs.statSync(srcPath).isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}