import { Router } from "express";
import {
  listNews,
  newsDetail,
  heroNews,
  terkiniNews,
  trendingNews,
  refreshSync,
} from "../controllers/news.controller.js";
import { validate } from "../middleware/validate.js";
import { newsListQuery, newsIdParams } from "../validations/news.validation.js";

const router = Router();

router.get("/", validate({ query: newsListQuery }), listNews);
router.get("/hero", heroNews);
router.get("/terkini", terkiniNews);
router.get("/trending", trendingNews);
router.get("/sync", refreshSync);
router.get("/:id", validate({ params: newsIdParams }), newsDetail);

export default router;
