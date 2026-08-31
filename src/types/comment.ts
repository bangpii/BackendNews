export interface SocialUser {
  id: string;
  name: string;
  role: string;
  avatarHue: number;
  verified?: boolean;
  anonymous?: boolean;
}

export interface CommentDoc {
  id: string;
  articleId?: string;
  postId?: string;
  user: SocialUser;
  body: string;
  likes: number;
  createdAt: number;
}
