import type { SocialUser } from "./comment.js";

export interface PostMedia {
  image?: string;
  video?: string;
}

export interface PostComment {
  user: SocialUser;
  body: string;
  createdAt: number;
}

export interface PostDoc {
  id: string;
  user: SocialUser;
  content: string;
  tags: string[];
  likes: number;
  comments: PostComment[];
  shares: number;
  createdAt: number;
  displayName?: string;
  media?: PostMedia;
}
