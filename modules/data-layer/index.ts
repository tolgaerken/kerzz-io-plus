// Data Layer Module Exports

// Hooks
export { useBaseMongo } from './hooks/useBaseMongo';
export { useBaseQuery } from './hooks/useBaseQuery';
export { useSocket } from './hooks/useSocket';

// Services
export { socketService, SocketService } from './services/socketService';
export type { SocketState } from './services/socketService';

// Types
export * from './types';

// Constants
export * from './constants';

// Utils
export { generateMaxiId } from './utils/idGenerator';