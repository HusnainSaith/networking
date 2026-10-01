import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'fs';
import { mkdir, stat, writeFile } from 'fs/promises';
import { extname, resolve, sep } from 'path';
import { randomUUID } from 'crypto';

const ALLOWED_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['application/pdf', '.pdf'],
  ['application/msword', '.doc'],
  [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.docx',
  ],
]);

@Injectable()
export class FileStorageService {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = resolve(
      config.get<string>('FILE_STORAGE_PATH', 'storage/activity-evidence'),
    );
  }

  async store(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file?.buffer?.length)
      throw new BadRequestException('File is required');
    if (file.size > 10 * 1024 * 1024)
      throw new BadRequestException('File size cannot exceed 10 MB');
    const extension = ALLOWED_TYPES.get(file.mimetype);
    if (!extension) throw new BadRequestException('Unsupported file type');
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const directory = resolve(this.root, safeFolder);
    await mkdir(directory, { recursive: true });
    const key = `${safeFolder}/${randomUUID()}${extension || extname(file.originalname)}`;
    await writeFile(this.resolveKey(key), file.buffer, { flag: 'wx' });
    return key;
  }

  async open(key: string) {
    const path = this.resolveKey(key);
    try {
      const details = await stat(path);
      return { stream: createReadStream(path), size: details.size };
    } catch {
      throw new NotFoundException('Stored file not found');
    }
  }

  private resolveKey(key: string): string {
    const path = resolve(this.root, key);
    if (path !== this.root && !path.startsWith(`${this.root}${sep}`)) {
      throw new BadRequestException('Invalid storage key');
    }
    return path;
  }
}
