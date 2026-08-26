import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email!: string;

  @IsString()
  @MinLength(8, { message: "Mật khẩu phải từ 8 ký tự" })
  @MaxLength(72, { message: "Mật khẩu tối đa 72 ký tự" })
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;
}

export class LoginDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshDto {
  @IsString()
  refreshToken!: string;
}
