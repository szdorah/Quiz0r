import { vi } from "vitest";

type Emission = { event: string; payload: any };

export function createMockSocket(id: string) {
  const emissions: Emission[] = [];
  return {
    id,
    emissions,
    join: vi.fn(),
    leave: vi.fn(),
    on: vi.fn(),
    emit: (event: string, payload?: any) => {
      emissions.push({ event, payload });
    },
  };
}

export function createMockIo() {
  const roomEvents = new Map<string, Emission[]>();
  const socketMap = new Map<string, any>();

  return {
    sockets: { sockets: socketMap },
    emitted: roomEvents,
    registerSocket(socket: any) {
      socketMap.set(socket.id, socket);
    },
    to(room: string) {
      return {
        emit: (event: string, payload?: any) => {
          const events = roomEvents.get(room) || [];
          events.push({ event, payload });
          roomEvents.set(room, events);
        },
      };
    },
  };
}
