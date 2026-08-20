import { IsString, MaxLength, MinLength } from 'class-validator'

export class AdminLoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  username: string

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password: string
}
