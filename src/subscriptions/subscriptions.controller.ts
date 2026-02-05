import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  AddPaymentDto,
} from './dto/subscription.dto';
import { SubscriptionStatus } from './schemas/subscription.schema';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

@Controller('subscriptions')
@UseGuards(AuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /**
   * Get current user's subscriptions
   */
  @Get('me')
  async getMySubscriptions(@CurrentUser() user: UserDocument) {
    return this.subscriptionsService.findByUserId(user._id.toString());
  }

  /**
   * Get current user's active subscription
   */
  @Get('me/active')
  async getMyActiveSubscription(@CurrentUser() user: UserDocument) {
    return this.subscriptionsService.findActiveByUserId(user._id.toString());
  }

  /**
   * Get subscription by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.subscriptionsService.findById(id);
  }

  /**
   * Create a new subscription (admin only - for manual subscriptions)
   * In production, subscriptions are typically created via webhooks
   */
  @Post()
  async create(@Body() createSubscriptionDto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(createSubscriptionDto);
  }

  /**
   * Update subscription
   */
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(id, updateSubscriptionDto);
  }

  /**
   * Update subscription status
   */
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: SubscriptionStatus,
  ) {
    return this.subscriptionsService.updateStatus(id, status);
  }

  /**
   * Cancel subscription
   */
  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @Body('immediate') immediate?: boolean,
  ) {
    return this.subscriptionsService.cancel(id, immediate);
  }

  /**
   * Add payment to subscription history
   */
  @Post(':id/payments')
  async addPayment(
    @Param('id') id: string,
    @Body() paymentDto: AddPaymentDto,
  ) {
    return this.subscriptionsService.addPayment(id, paymentDto);
  }

  /**
   * Delete subscription (admin only)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.subscriptionsService.delete(id);
  }

  /**
   * Webhook endpoint for payment providers
   * This will be implemented when integrating Stripe/PayPal
   */
  @Post('webhooks/:provider')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() event: Record<string, unknown>,
  ) {
    await this.subscriptionsService.processWebhook(provider, event);
    return { received: true };
  }
}
