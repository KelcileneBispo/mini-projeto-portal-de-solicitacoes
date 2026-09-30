import type {
  RequestCategory,
  RequestStatus,
} from '../../generated/prisma/enums.js';
import type { PublicUser } from '../auth/public-user.js';

export type RequestDetail = {
  id: number;
  title: string;
  description: string;
  category: RequestCategory;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  requester: PublicUser;
};

export type RequestListItem = {
  id: number;
  title: string;
  category: RequestCategory;
  status: RequestStatus;
  createdAt: Date;
  requester: PublicUser;
};

export type RequestList = {
  data: RequestListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
