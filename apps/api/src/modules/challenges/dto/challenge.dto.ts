import { IsBoolean, IsIn, IsInt, IsString, Max, Min } from 'class-validator';

export const DUEL_METRICS = ['commits', 'problems', 'active_days'] as const;
export type DuelMetric = (typeof DUEL_METRICS)[number];

export class CreateDuelDto {
  @IsString() opponentId!: string;
  @IsIn(DUEL_METRICS) metric!: DuelMetric;
  @IsInt() @Min(1) @Max(1000) target!: number;
  @IsInt() @Min(1) @Max(60) days!: number;
}

export class RespondDuelDto {
  @IsBoolean() accept!: boolean;
}
