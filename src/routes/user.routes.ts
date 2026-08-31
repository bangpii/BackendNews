import { Router } from "express";
import { getMe, updateIdentity } from "../controllers/user.controller.js";
import { validate } from "../middleware/validate.js";
import { userIdentitySchema } from "../validations/user.validation.js";

const router = Router();

router.get("/me", getMe);
router.put("/me", validate({ body: userIdentitySchema }), updateIdentity);

export default router;