// Opciones de configuración para Cloudinary
export interface CloudinaryOptions {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// Opciones para subir archivos
export interface UploadOptions {
  folder?: string;
  publicId?: string;
  overwrite?: boolean;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  transformation?: TransformationOptions;
}

// Opciones de transformación de imagen
export interface TransformationOptions {
  width?: number;
  height?: number;
  crop?: 'auto' | 'fill' | 'fit' | 'scale' | 'thumb';
  gravity?: 'auto' | 'face' | 'center' | 'north' | 'south' | 'east' | 'west';
  quality?: 'auto' | number;
  format?: 'auto' | 'jpg' | 'png' | 'webp' | 'gif';
}

// Respuesta de subida de Cloudinary
export interface UploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  resourceType: string;
  createdAt: string;
}

// Respuesta de eliminación
export interface DeleteResult {
  result: 'ok' | 'not found';
}
