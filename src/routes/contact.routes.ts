import { Router } from "express";
import { sendContact } from "../controllers/contact.controller.js";
import { validate } from "../middleware/validate.js";
import { strictLimiter } from "../middleware/rateLimit.js";
import { contactSchema } from "../validations/contact.validation.js";

const router = Router();

router.post("/", strictLimiter, validate({ body: contactSchema }), sendContact);

export default router;