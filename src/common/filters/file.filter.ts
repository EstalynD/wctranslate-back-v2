import { BadRequestException } from '@nestjs/common';

/**
 * Filtro para validar que solo se suban imágenes
 */
export const imageFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/x-icon',
    'image/vnd.microsoft.icon',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten imágenes (JPEG, PNG, GIF, WebP, SVG, ICO).`,
      ),
      false,
    );
  }

  callback(null, true);
};

/**
 * Límite de tamaño de archivo (5MB)
 */
export const fileSizeLimit = 5 * 1024 * 1024;

/**
 * Filtro para validar videos
 */
export const videoFileFilter = (
  req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        `Tipo de archivo no permitido: ${file.mimetype}. Solo se permiten videos (MP4, WebM, MOV).`,
      ),
      false,
    );
  }

  callback(null, true);
};

/**
 * Límite de tamaño para videos (100MB)
 */
export const videoSizeLimit = 100 * 1024 * 1024;
