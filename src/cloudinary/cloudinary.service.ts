import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import {
  UploadOptions,
  TransformationOptions,
  UploadResult,
  DeleteResult,
} from './interfaces';

@Injectable()
export class CloudinaryService {
  /**
   * Sube una imagen desde una URL
   */
  async uploadFromUrl(
    url: string,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    try {
      const uploadOptions = this.buildUploadOptions(options);
      const result = await cloudinary.uploader.upload(url, uploadOptions);
      return this.mapUploadResponse(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(
        `Error al subir imagen desde URL: ${message}`,
      );
    }
  }

  /**
   * Sube una imagen desde un buffer (para archivos subidos via multipart)
   */
  async uploadFromBuffer(
    buffer: Buffer,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions = this.buildUploadOptions(options);

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            reject(
              new BadRequestException(`Error al subir imagen: ${error.message}`),
            );
          } else if (result) {
            resolve(this.mapUploadResponse(result));
          }
        },
      );

      // Convertir buffer a stream y enviarlo
      const readableStream = new Readable();
      readableStream.push(buffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  }

  /**
   * Sube una imagen desde un archivo Express/Multer
   */
  async uploadFile(
    file: Express.Multer.File,
    options?: UploadOptions,
  ): Promise<UploadResult> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Archivo no proporcionado');
    }
    return this.uploadFromBuffer(file.buffer, options);
  }

  /**
   * Genera una URL optimizada para una imagen
   */
  getOptimizedUrl(publicId: string, options?: TransformationOptions): string {
    return cloudinary.url(publicId, {
      fetch_format: options?.format || 'auto',
      quality: options?.quality || 'auto',
      secure: true,
    });
  }

  /**
   * Genera una URL con transformaciones personalizadas
   */
  getTransformedUrl(
    publicId: string,
    options: TransformationOptions,
  ): string {
    return cloudinary.url(publicId, {
      crop: options.crop || 'auto',
      gravity: options.gravity || 'auto',
      width: options.width,
      height: options.height,
      fetch_format: options.format || 'auto',
      quality: options.quality || 'auto',
      secure: true,
    });
  }

  /**
   * Genera una URL de miniatura cuadrada
   */
  getThumbnailUrl(
    publicId: string,
    size: number = 150,
  ): string {
    return cloudinary.url(publicId, {
      crop: 'thumb',
      gravity: 'face',
      width: size,
      height: size,
      fetch_format: 'auto',
      quality: 'auto',
      secure: true,
    });
  }

  /**
   * Elimina una imagen de Cloudinary
   */
  async delete(
    publicId: string,
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<DeleteResult> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return { result: result.result };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(
        `Error al eliminar imagen: ${message}`,
      );
    }
  }

  /**
   * Elimina múltiples imágenes
   */
  async deleteMultiple(
    publicIds: string[],
    resourceType: 'image' | 'video' | 'raw' = 'image',
  ): Promise<{ deleted: Record<string, string> }> {
    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType,
      });
      return { deleted: result.deleted };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(
        `Error al eliminar imágenes: ${message}`,
      );
    }
  }

  /**
   * Obtiene información de una imagen
   */
  async getImageInfo(publicId: string): Promise<UploadApiResponse> {
    try {
      return await cloudinary.api.resource(publicId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(
        `Error al obtener información de imagen: ${message}`,
      );
    }
  }

  /**
   * Construye las opciones de subida para Cloudinary
   */
  private buildUploadOptions(options?: UploadOptions): Record<string, unknown> {
    const uploadOptions: Record<string, unknown> = {
      resource_type: options?.resourceType || 'auto',
    };

    if (options?.folder) {
      uploadOptions.folder = options.folder;
    }

    if (options?.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    if (options?.overwrite !== undefined) {
      uploadOptions.overwrite = options.overwrite;
    }

    if (options?.transformation) {
      uploadOptions.transformation = {
        width: options.transformation.width,
        height: options.transformation.height,
        crop: options.transformation.crop,
        gravity: options.transformation.gravity,
        quality: options.transformation.quality,
        fetch_format: options.transformation.format,
      };
    }

    return uploadOptions;
  }

  /**
   * Mapea la respuesta de Cloudinary al formato interno
   */
  private mapUploadResponse(result: UploadApiResponse): UploadResult {
    return {
      publicId: result.public_id,
      url: result.url,
      secureUrl: result.secure_url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resourceType: result.resource_type,
      createdAt: result.created_at,
    };
  }
}
