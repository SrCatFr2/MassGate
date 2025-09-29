const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Configuración de multer para memoria
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Verificar que sea una imagen
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB límite
  }
});

// Función para procesar y guardar imagen
const processImage = async (buffer, userId) => {
  try {
    // Crear directorio si no existe
    const uploadDir = path.join(__dirname, '../public/uploads/profiles');
    await fs.mkdir(uploadDir, { recursive: true });

    // Procesar imagen con Sharp
    const filename = `profile_${userId}_${Date.now()}.webp`;
    const filepath = path.join(uploadDir, filename);

    await sharp(buffer)
      .resize(200, 200, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    return `/uploads/profiles/${filename}`;
  } catch (error) {
    throw new Error('Error procesando imagen: ' + error.message);
  }
};

// Función para eliminar imagen anterior
const deleteOldImage = async (imagePath) => {
  if (imagePath && imagePath.startsWith('/uploads/')) {
    try {
      const fullPath = path.join(__dirname, '../public', imagePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.log('No se pudo eliminar imagen anterior:', error.message);
    }
  }
};

module.exports = {
  upload,
  processImage,
  deleteOldImage
};