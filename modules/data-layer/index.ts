// Data Layer Module Exports

// Hooks
export { useBaseMongo } from './hooks/useBaseMongo';
export { useBaseQuery } from './hooks/useBaseQuery';
export { useCitiesQuery } from './hooks/useCitiesQuery';
export { useCountiesQuery } from './hooks/useCountiesQuery';
export { useOpportunitiesQuery } from './hooks/useOpportunitiesQuery';
export { useIsSalesperson, useSalespeople, useSalespeopleQuery } from './hooks/useSalespeopleQuery';
export { useLicenseQuery } from './hooks/useLicenseQuery';
export { useSocket } from './hooks/useSocket';

// Services
export { SocketService, socketService } from './services/socketService';
export type { SocketState } from './services/socketService';

// Types
export * from './types';

// Constants
export * from './constants';

// Utils
export { generateMaxiId } from './utils/idGenerator';
