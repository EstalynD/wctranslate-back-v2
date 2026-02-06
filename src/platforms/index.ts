// Module
export { PlatformsModule } from './platforms.module';

// Service
export { PlatformsService } from './platforms.service';

// Schema
export {
  Platform,
  PlatformSchema,
  PlatformStatus,
  PlatformType,
  generatePlatformSlug,
} from './schemas/platform.schema';

export type { PlatformDocument } from './schemas/platform.schema';

// DTOs
export {
  CreatePlatformDto,
  UpdatePlatformDto,
  QueryPlatformDto,
} from './dto/platform.dto';
