import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { INVALID_ID_MESSAGE, invalidData } from './requests.errors.js';

@Injectable()
export class RequestIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^[1-9]\d*$/.test(value)) {
      throw invalidId();
    }

    const id = Number(value);

    if (!Number.isSafeInteger(id)) {
      throw invalidId();
    }

    return id;
  }
}

function invalidId(): BadRequestException {
  return invalidData('id', INVALID_ID_MESSAGE);
}
