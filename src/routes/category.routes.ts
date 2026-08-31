import { Router } from "express";
import { listCategories, newsByCategory } from "../controllers/category.controller.js";

const router = Router();

router.get("/", listCategories);
router.get("/:slug", newsByCategory);

export default router;
