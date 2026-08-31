import { Router } from "express";
import {
  getArticleComments,
  postArticleComment,
  toggleCommentLike,
  getArticleCommentCount,
} from "../controllers/comment.controller.js";
import { validate } from "../middleware/validate.js";
import { commentBodySchema } from "../validations/comment.validation.js";

const router = Router();

router.get("/article/:id", getArticleComments);
router.get("/article/:id/count", getArticleCommentCount);
router.post("/article/:id", validate({ body: commentBodySchema }), postArticleComment);
router.post("/:id/like", toggleCommentLike);

export default router;
