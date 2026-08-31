import { Router } from "express";
import { whoAmI } from "../controllers/auth.controller.js";

const router = Router();

router.get("/whoami", whoAmI);

export default router;