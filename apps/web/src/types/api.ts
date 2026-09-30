export type User = {
  id: number;
  username: string;
  name: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
};

export type ApiErrorDetail = {
  field: string;
  message: string;
};

export type ApiErrorBody = {
  statusCode: number;
  error?: string;
  message: string;
  details?: ApiErrorDetail[];
};

export type RequestCategory =
  'TI' | 'RH' | 'COMPRAS' | 'FINANCEIRO' | 'INFRAESTRUTURA';

export type RequestStatus = 'ABERTO' | 'EM_ATENDIMENTO' | 'CONCLUIDO';

export type RequestListItem = {
  id: number;
  title: string;
  category: RequestCategory;
  status: RequestStatus;
  createdAt: string;
  requester: User;
};

export type RequestListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type RequestListResponse = {
  data: RequestListItem[];
  meta: RequestListMeta;
};

export type DashboardResponse = {
  total: number;
  open: number;
  inProgress: number;
  completed: number;
};

export type RequestFilters = {
  title: string;
  category: '' | RequestCategory;
  status: '' | RequestStatus;
  from: string;
  to: string;
};
