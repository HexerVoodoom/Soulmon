export const ROOT: string;
export const DIRS: string[];
export const SYM_MAX_PX: number;
export const ORB_OVERRIDE: Record<string, string>;
export function measureFacing(file: string, estado: string): Promise<{ dir: 'R' | 'L' | 'S'; v: number }>;
export function listFxFiles(): Record<string, Record<string, string>>;
