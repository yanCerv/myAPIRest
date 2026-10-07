import { Type } from 'class-transformer';
import { ArrayMinSize, ArrayUnique, IsArray, IsEmail, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class PurchaseBuyerDto {
  @ApiProperty({ example: 'Yan', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: 'Cervantes', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ example: 'person@example.com', maxLength: 320 })
  @IsEmail()
  @MaxLength(320)
  email!: string;
}

class SandboxPaymentDto {
  @ApiProperty({ description: 'Sandbox card number only. Never stored or returned.', example: '4242 4242 4242 4242' })
  @IsString()
  @MaxLength(32)
  cardNumber!: string;

  @ApiProperty({ description: 'Sandbox expiry in MM/YY format.', example: '10/30' })
  @Matches(/^\d{2}\/\d{2}$/)
  expiry!: string;

  @ApiProperty({ description: 'Sandbox CVC. Never stored or returned.', example: '111' })
  @Matches(/^\d{3,4}$/)
  cvc!: string;
}

export class CreatePurchaseDto {
  @ApiProperty({ example: 'demo-11982-2026-10-07-cine-3-1645' })
  @IsString()
  @MaxLength(255)
  showtimeId!: string;

  @ApiProperty({
    example: ['demo-11982-2026-10-07-cine-3-1645:A-1', 'demo-11982-2026-10-07-cine-3-1645:A-2'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  seatIds!: string[];

  @ApiProperty({ type: PurchaseBuyerDto })
  @ValidateNested()
  @Type(() => PurchaseBuyerDto)
  buyer!: PurchaseBuyerDto;

  @ApiProperty({ type: SandboxPaymentDto })
  @ValidateNested()
  @Type(() => SandboxPaymentDto)
  payment!: SandboxPaymentDto;
}
