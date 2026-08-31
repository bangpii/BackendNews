import { Router } from "express";
import {
  getPosts,
  createPost,
  likePost,
  addPostComment,
  sharePostCtrl,
} from "../controllers/post.controller.js";
import { getPostComments } from "../controllers/comment.controller.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import { strictLimiter } from "../middleware/rateLimit.js";
import { createPostSchema } from "../validations/post.validation.js";
import { commentBodySchema } from "../validations/comment.validation.js";

const router = Router();

router.get("/", getPosts);
router.post("/", strictLimiter, upload.single("media"), validate({ body: createPostSchema }), createPost);
router.get("/:id/comments", getPostComments);
router.post("/:id/comments", strictLimiter, validate({ body: commentBodySchema }), addPostComment);
router.post("/:id/like", strictLimiter, likePost);
router.post("/:id/share", strictLimiter, sharePostCtrl);

export default router;
