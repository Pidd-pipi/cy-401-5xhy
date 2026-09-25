import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { User } from '../user/entity/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.userRepository.findOne({ where: { email: dto.email } });
    if (exists) {
      throw new ConflictException('Email already registered');
    }

    const user = this.userRepository.create({
      username: dto.username,
      email: dto.email,
      role: dto.role || UserRole.Dual,
      passwordHash: await bcrypt.hash(dto.password, 10),
      skillTags: []
    });
    const saved = await this.userRepository.save(user);
    return this.issueToken(saved);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: dto.email })
      .getOne();

    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.issueToken(user);
  }

  async findMe(userId: string) {
    return this.userRepository.findOneOrFail({ where: { id: userId } });
  }

  private issueToken(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return {
      token: this.jwtService.sign(payload),
      user: safeUser
    };
  }
}
