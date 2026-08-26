import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class KanaStatDto {
  @IsString()
  kanaKey!: string;

  @IsInt()
  @Min(0)
  correct!: number;

  @IsInt()
  @Min(0)
  wrong!: number;

  @IsInt()
  @Min(0)
  streak!: number;
}

export class SrsCardDto {
  @IsString()
  cardId!: string;

  @IsString()
  deckId!: string;

  @IsInt()
  @Min(0)
  box!: number;

  @IsInt()
  @Min(0)
  dueDay!: number;
}

export class TestAttemptDto {
  @IsString()
  type!: string;

  @IsString()
  level!: string;

  @IsInt()
  @Min(1)
  total!: number;

  @IsInt()
  @Min(0)
  correct!: number;

  @IsInt()
  @Min(0)
  seconds!: number;

  @IsDateString()
  createdAt!: string;
}

export class SyncDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KanaStatDto)
  kanaStats?: KanaStatDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SrsCardDto)
  srsCards?: SrsCardDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestAttemptDto)
  attempts?: TestAttemptDto[];
}
