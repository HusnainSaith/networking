import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicianProfile } from './entities/technician-profile.entity';
import { TechnicianSkill } from './entities/technician-skill.entity';
import { TechnicianCertification } from './entities/technician-certification.entity';
import { TechnicianRegion } from './entities/technician-region.entity';
import { Skill } from './entities/skill.entity';
import { Certification } from './entities/certification.entity';
import { Vehicle } from './entities/vehicle.entity';
import { User } from '../users/entities/user.entity';
import { TechniciansService } from './technicians.service';
import { TechniciansController } from './technicians.controller';
import { AuthModule } from '../auth/auth.module';
import { GuardsModule } from '../../common/modules/guards.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TechnicianProfile,
      TechnicianSkill,
      TechnicianCertification,
      TechnicianRegion,
      Skill,
      Certification,
      Vehicle,
      User,
    ]),
    AuthModule,
    GuardsModule,
  ],
  controllers: [TechniciansController],
  providers: [TechniciansService],
  exports: [TechniciansService],
})
export class TechniciansModule {}
