import type { Prisma } from '@prisma/client';
import type { DtoId } from 'common/types/brandedId';
import type { RoomDto, RoomUpdateVal } from 'common/types/room';
import type { UserDto } from 'common/types/user';
import { fireFlowerCommand } from 'domain/fireFlower/repository/fireFlowerCommand';
import { fireFlowerQuery } from 'domain/fireFlower/repository/fireFlowerQuery';
import { transaction } from 'service/prismaClient';
import { roomMethod } from '../model/roomMethod';
import type { RoomCreateServerVal, RoomEntity } from '../model/roomType';
import { roomCommand } from '../repository/roomCommand';
import { toRoomDto, toRoomsDto } from '../service/toRoomDto';
import { roomQuery } from './../repository/roomQuery';

const enterRoom = async (
  tx: Prisma.TransactionClient,
  user: UserDto,
  room: RoomEntity,
  fireFlowerIds: DtoId['fireFlower'][],
): Promise<RoomDto> => {
  const userInRoom = await roomQuery.hasUser.findByUserId(tx, user.id);
  const found = roomMethod.find(room);
  const fireFlowers = await fireFlowerQuery.findByIds(tx, fireFlowerIds);
  const entered = roomMethod.entered(user, found, userInRoom.found, fireFlowers);

  await roomCommand.userIn.create(tx, entered);
  await roomCommand.save(tx, entered);
  await fireFlowerCommand.withUser.create(tx, entered);

  return toRoomDto(entered.room);
};

export const roomUseCase = {
  create: (user: UserDto, val: RoomCreateServerVal): Promise<RoomDto> =>
    transaction('RepeatableRead', async (tx) => {
      const created = roomMethod.create(user, val);

      await roomCommand.save(tx, created);

      return toRoomDto(created.room);
    }),
  updateRoomName: (user: UserDto, val: RoomUpdateVal, roomId: string): Promise<RoomDto> =>
    transaction('RepeatableRead', async (tx) => {
      const room = await roomQuery.findById(tx, roomId);
      const updated = roomMethod.update(user, room, val);

      await roomCommand.save(tx, updated);

      return toRoomDto(updated.room);
    }),
  findAll: (): Promise<RoomDto[]> =>
    transaction('RepeatableRead', async (tx) => {
      const rooms = await roomQuery.listByCreatedAt(tx);
      const found = roomMethod.findMany(rooms);

      return toRoomsDto(found);
    }),
  enterPrivateRoom: (
    user: UserDto,
    password: string,
    fireFlowerIds: DtoId['fireFlower'][],
  ): Promise<RoomDto> =>
    transaction('RepeatableRead', async (tx) => {
      const room = await roomQuery.findByPassword(tx, password);

      return await enterRoom(tx, user, room, fireFlowerIds);
    }),
  enterRoom: (
    user: UserDto,
    roomId: DtoId['room'],
    fireFlowerIds: DtoId['fireFlower'][],
  ): Promise<RoomDto> =>
    transaction('RepeatableRead', async (tx) => {
      const room = await roomQuery.findById(tx, roomId);
      return await enterRoom(tx, user, room, fireFlowerIds);
    }),
  exitRoom: (user: UserDto): Promise<RoomDto> =>
    transaction('RepeatableRead', async (tx) => {
      const userInRoom = await roomQuery.hasUser.findByUserId(tx, user.id);
      const exit = roomMethod.exit(user, userInRoom);
      const room = await roomQuery.findById(tx, exit.roomId);

      await roomCommand.userIn.delete(tx, exit);

      return toRoomDto(room);
    }),
  delete: (user: UserDto, roomId: string): Promise<RoomDto> =>
    transaction('RepeatableRead', async (tx) => {
      const room = await roomQuery.findById(tx, roomId);
      const deleted = roomMethod.delete(user, room);

      await roomCommand.delete(tx, deleted);

      return toRoomDto(deleted.room);
    }),
};
