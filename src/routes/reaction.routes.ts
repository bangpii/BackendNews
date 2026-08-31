import { Router } from "express";
import { react, getReactions } from "../controllers/reaction.controller.js";
import { validate } from "../middleware/validate.js";
import { strictLimiter } from "../middleware/rateLimit.js";
import { reactionBodySchema } from "../validations/reaction.validation.js";

const router = Router();

router.post("/:type/:id", strictLimiter, validate({ body: reactionBodySchema }), react);
router.get("/:type/:id", getReactions);

export default router;