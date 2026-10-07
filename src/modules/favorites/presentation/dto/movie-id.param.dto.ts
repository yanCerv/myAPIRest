import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class MovieIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  movieId!: number;
}
