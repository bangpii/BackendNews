import { Router } from "express";
import newsRoutes from "./news.routes.js";
import categoryRoutes from "./category.routes.js";
import commentRoutes from "./comment.routes.js";
import postRoutes from "./post.routes.js";
import userRoutes from "./user.routes.js";
import contactRoutes from "./contact.routes.js";
import authRoutes from "./auth.routes.js";
import reactionRoutes from "./reaction.routes.js";
import viewRoutes from "./view.routes.js";

const router = Router();

router.use("/news", newsRoutes);
router.use("/categories", categoryRoutes);
router.use("/comments", commentRoutes);
router.use("/posts", postRoutes);
router.use("/users", userRoutes);
router.use("/contact", contactRoutes);
router.use("/auth", authRoutes);
router.use("/reactions", reactionRoutes);
router.use("/views", viewRoutes);

export default router;