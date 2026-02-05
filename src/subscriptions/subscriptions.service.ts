import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
  SubscriptionStatus,
  PaymentHistoryItem,
} from './schemas/subscription.schema';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  AddPaymentDto,
} from './dto/subscription.dto';
import { UsersService } from '../users/users.service';
import { PlanType } from '../users/schemas/user.schema';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private usersService: UsersService,
  ) {}

  async create(
    createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = new this.subscriptionModel(createSubscriptionDto);
    const savedSubscription = await subscription.save();

    // Sync with user's subscriptionAccess
    await this.syncUserSubscriptionAccess(
      createSubscriptionDto.userId,
      savedSubscription,
    );

    return savedSubscription;
  }

  async findById(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionModel.findById(id).exec();
    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
    return subscription;
  }

  async findByUserId(userId: string): Promise<Subscription[]> {
    return this.subscriptionModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findActiveByUserId(userId: string): Promise<Subscription | null> {
    return this.subscriptionModel
      .findOne({
        userId: new Types.ObjectId(userId),
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      })
      .exec();
  }

  async update(
    id: string,
    updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionModel
      .findByIdAndUpdate(id, { $set: updateSubscriptionDto }, { new: true })
      .exec();

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Sync with user's subscriptionAccess
    await this.syncUserSubscriptionAccess(
      subscription.userId.toString(),
      subscription,
    );

    return subscription;
  }

  async updateStatus(
    id: string,
    status: SubscriptionStatus,
  ): Promise<Subscription> {
    const subscription = await this.subscriptionModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .exec();

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    // Sync with user's subscriptionAccess
    await this.syncUserSubscriptionAccess(
      subscription.userId.toString(),
      subscription,
    );

    return subscription;
  }

  async cancel(id: string, immediate = false): Promise<Subscription> {
    const subscription = await this.findById(id);

    if (immediate) {
      subscription.status = SubscriptionStatus.CANCELED;
      subscription.canceledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    const updatedSubscription = await this.subscriptionModel
      .findByIdAndUpdate(id, { $set: subscription }, { new: true })
      .exec();

    if (immediate && updatedSubscription) {
      await this.syncUserSubscriptionAccess(
        updatedSubscription.userId.toString(),
        updatedSubscription,
      );
    }

    return updatedSubscription!;
  }

  async addPayment(id: string, paymentDto: AddPaymentDto): Promise<Subscription> {
    const payment: PaymentHistoryItem = {
      ...paymentDto,
      currency: paymentDto.currency || 'USD',
      date: new Date(),
    };

    const subscription = await this.subscriptionModel
      .findByIdAndUpdate(
        id,
        { $push: { paymentHistory: payment } },
        { new: true },
      )
      .exec();

    if (!subscription) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }

    return subscription;
  }

  async delete(id: string): Promise<void> {
    const result = await this.subscriptionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Subscription with ID ${id} not found`);
    }
  }

  /**
   * Sync user's subscriptionAccess subdocument with subscription data
   */
  private async syncUserSubscriptionAccess(
    userId: string,
    subscription: Subscription,
  ): Promise<void> {
    const isActive = [
      SubscriptionStatus.ACTIVE,
      SubscriptionStatus.TRIALING,
    ].includes(subscription.status);

    // Map planId to PlanType (you can customize this mapping)
    const planTypeMap: Record<string, PlanType> = {
      free: PlanType.FREE,
      pro: PlanType.PRO,
      elite: PlanType.ELITE,
      tester: PlanType.TESTER,
    };

    const planType = planTypeMap[subscription.planId.toLowerCase()] || PlanType.FREE;

    await this.usersService.updateSubscriptionAccess(userId, {
      isActive,
      planType,
      expiresAt: subscription.currentPeriodEnd,
      subscriptionId: (subscription as SubscriptionDocument)._id?.toString(),
    });
  }

  /**
   * Process webhook events from payment providers (Stripe/PayPal)
   * This will be implemented when integrating payment providers
   */
  async processWebhook(
    provider: string,
    event: Record<string, unknown>,
  ): Promise<void> {
    // TODO: Implement webhook processing for Stripe/PayPal
    // This is a placeholder for future payment integration
    console.log(`Processing ${provider} webhook event:`, event);
  }
}
