import {
  IsString,
  IsOptional,
  IsEnum,
  IsDate,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  SubscriptionProvider,
  SubscriptionStatus,
} from '../schemas/subscription.schema';

export class CreateSubscriptionDto {
  @IsString()
  userId: string;

  @IsEnum(SubscriptionProvider)
  provider: SubscriptionProvider;

  @IsOptional()
  @IsString()
  externalSubscriptionId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsEnum(SubscriptionStatus)
  status: SubscriptionStatus;

  @IsString()
  planId: string;

  @Type(() => Date)
  @IsDate()
  currentPeriodStart: Date;

  @Type(() => Date)
  @IsDate()
  currentPeriodEnd: Date;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsEnum(SubscriptionProvider)
  provider?: SubscriptionProvider;

  @IsOptional()
  @IsString()
  externalSubscriptionId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  status?: SubscriptionStatus;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  currentPeriodStart?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  currentPeriodEnd?: Date;

  @IsOptional()
  @IsBoolean()
  cancelAtPeriodEnd?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentHistoryItemDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  status: string;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  invoiceUrl?: string;
}

export class AddPaymentDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  invoiceUrl?: string;
}
