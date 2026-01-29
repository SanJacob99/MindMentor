export interface Entry {
  id: string;
  createdAt: string; // ISO date string
  text?: string;
  mood: number;
  stress: number;
  energy: number;
  tags: string[];
}
