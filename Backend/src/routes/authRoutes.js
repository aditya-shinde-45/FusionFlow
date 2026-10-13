import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../validators/schemas.js";

const router = Router();

router.post("/login", authRateLimiter, validate(loginSchema), AuthController.login);
router.get("/me", authenticate, AuthController.me);
router.post("/logout", authenticate, AuthController.logout);

export default router;

