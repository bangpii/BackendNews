import { Router } from "express";
import {
  incrementView,
  getViews,
} from "../controllers/view.controller.js";

const router = Router();

router.post("/:id", incrementView);
router.get("/:id", getViews);

export default router;