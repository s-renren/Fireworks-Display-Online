import type { RoomStatus } from '@prisma/client';
import type { DtoId } from './brandedId';

export type RoomDto = {
  id: DtoId['room'];
  name: string;
  status: RoomStatus;
  createdAt: number;
  updatedAt?: number;
  lastUsedAt?: number;
  creator: { id: DtoId['user']; signInName: string };
  users?: { id: DtoId['user']; signInName: string }[];
};

export type RoomCreateVal = { name: string; password?: string; status: RoomStatus };

export type RoomUpdateVal = { name: string };

export type RoomFindVal = {
  id?: DtoId['room'];
  name?: string;
  status?: RoomStatus;
  createdBy?: DtoId['user'];
  createdAt?: number;
  updatedAt?: number;
  lastUsedAt?: number;
};

export type FriendRoomFindVal = { password: string; fireFlowerIds: DtoId['fireFlower'][] };
export type RoomStatusEnum = RoomStatus;
