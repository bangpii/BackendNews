export type ReactionKey = "senyum" | "ceria" | "ketawa" | "marah" | "sedih";

export interface ArticleReactions {
  [key: string]: number;
}

/**
 * Satu dokumen per (targetType + targetId) menyimpan akumulasi reaksi.
 * sub-collection `votes` menyimpan pilihan per pengguna/IP (anti spam).
 */
export interface ReactionDoc {
  id: string;
  targetType: "article" | "post" | "comment";
  targetId: string;
  counts: ArticleReactions;
  updatedAt: number;
}
