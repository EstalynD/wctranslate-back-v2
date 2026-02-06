import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserDocument } from '../../users/schemas/user.schema';

export const CurrentUser = createParamDecorator(
  (data: keyof UserDocument | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserDocument;

    if (!user) {
      return null;
    }

    // Si se solicita _id, convertir a string para consistencia
    if (data === '_id') {
      return user._id?.toString();
    }

    return data ? user[data] : user;
  },
);
