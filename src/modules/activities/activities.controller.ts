import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  StreamableFile,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { UuidValidationPipe } from '../../common/pipes/uuid-validation.pipe';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
import { ActivityQueryDto } from './dto/activity-query.dto';
import {
  AssignActivityDto,
  ChangeActivityStatusDto,
  CreateActivityNoteDto,
  CreateAttachmentDto,
  CreateCustomerSignatureDto,
} from './dto/activity-operations.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AttachmentType } from '../../common/enums/platform.enums';

@ApiTags('Activities')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Post() @Permissions('activities.create') create(
    @Body() dto: CreateActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(dto, userId);
  }
  @Get() @Permissions('activities.read') findAll(
    @Query() query: ActivityQueryDto,
  ) {
    return this.service.findAll(query);
  }
  @Get(':id') @Permissions('activities.read') findOne(
    @Param('id', UuidValidationPipe) id: string,
  ) {
    return this.service.findOne(id);
  }
  @Patch(':id') @Permissions('activities.update') update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ) {
    return this.service.update(id, dto);
  }
  @Delete(':id') @Permissions('activities.delete') remove(
    @Param('id', UuidValidationPipe) id: string,
  ) {
    return this.service.remove(id);
  }
  @Post(':id/assign') @Permissions('activities.assign') assign(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: AssignActivityDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.assign(id, dto, userId);
  }
  @Get(':id/suggestions') @Permissions('activities.assign') suggestions(
    @Param('id', UuidValidationPipe) id: string,
  ) {
    return this.service.suggestTechnicians(id);
  }
  @Patch(':id/status') @Permissions('activities.update') changeStatus(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: ChangeActivityStatusDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.changeStatus(id, dto, userId);
  }
  @Post(':id/notes') @Permissions('activities.update') addNote(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: CreateActivityNoteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.addNote(id, dto, userId);
  }
  @Post(':id/attachments') @Permissions('activities.update') addAttachment(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: CreateAttachmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.addAttachment(id, dto, userId);
  }
  @Post(':id/evidence')
  @Permissions('activities.update')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  uploadEvidence(
    @Param('id', UuidValidationPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
    @Body('type') type?: AttachmentType,
  ) {
    return this.service.uploadAttachment(id, file, userId, type);
  }
  @Get('attachments/:attachmentId/download')
  @Permissions('activities.read')
  async downloadAttachment(
    @Param('attachmentId', UuidValidationPipe) attachmentId: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { attachment, stream, size } =
      await this.service.openAttachment(attachmentId);
    response.set({
      'content-type': attachment.mimeType,
      'content-length': String(size),
      'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`,
    });
    return new StreamableFile(stream);
  }
  @Post(':id/signatures') @Permissions('activities.update') addSignature(
    @Param('id', UuidValidationPipe) id: string,
    @Body() dto: CreateCustomerSignatureDto,
    @Ip() ipAddress: string,
  ) {
    return this.service.addSignature(id, dto, ipAddress);
  }
}
