import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { JwtService } from '@nestjs/jwt'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { Admin } from './admin.entity'
import { AdminLoginDto } from './dto/admin-login.dto'

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: AdminLoginDto) {
    const admin = await this.adminRepo.findOne({ where: { username: dto.username } })
    if (!admin || !bcrypt.compareSync(dto.password, admin.passwordHash)) {
      throw new UnauthorizedException('账号或密码错误')
    }
    admin.lastLoginAt = Date.now()
    await this.adminRepo.save(admin)
    const token = this.jwtService.sign({
      userId: admin.id,
      role: 'admin',
      adminRole: admin.role,
      username: admin.username
    })
    return { token, adminInfo: this.toVO(admin) }
  }

  async profile(adminId: number) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } })
    if (!admin) throw new UnauthorizedException('管理员不存在')
    return this.toVO(admin)
  }

  private toVO(admin: Admin) {
    return {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role,
      lastLoginAt: admin.lastLoginAt
    }
  }
}
