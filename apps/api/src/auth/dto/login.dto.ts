import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsString({ message: 'Usuário deve ser um texto' })
  @IsNotEmpty({ message: 'Usuário é obrigatório' })
  @MinLength(3, { message: 'Usuário deve ter entre 3 e 50 caracteres' })
  @MaxLength(50, { message: 'Usuário deve ter entre 3 e 50 caracteres' })
  username!: string;

  @IsString({ message: 'Senha deve ser um texto' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  @MinLength(8, { message: 'Senha deve ter entre 8 e 72 caracteres' })
  @MaxLength(72, { message: 'Senha deve ter entre 8 e 72 caracteres' })
  password!: string;
}
