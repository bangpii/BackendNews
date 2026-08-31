export type CategoryKey =
  | "nasional"
  | "ekonomi"
  | "teknologi"
  | "olahraga"
  | "internasional"
  | "hiburan";

export interface LocalizedText {
  id: string;
  en: string;
}

export interface NewsDoc {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image?: string;
  video?: string;
  source: string;
  sourceUrl: string;
  sourceType?: string;
  category: string;
  tags: string[];
  author?: string;
  role?: string;
  publishedAt: string;
  publishedAtDate: string;
  views: number;
  live?: boolean;
  featured?: boolean;
  createdAt: number;
  updatedAt: number;
}
