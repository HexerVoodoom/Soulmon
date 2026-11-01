export const ROOT: string;
export const FEET_DIRS: string[];
export const ALPHA_MIN: number;
export function listFeetFiles(): string[];
export function measureFeet(file: string): Promise<number | null>;
export function measureAll(): Promise<Record<string, number>>;
