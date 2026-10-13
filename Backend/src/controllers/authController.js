import { AuthService } from "../services/authService.js";
import { successResponse } from "../utils/response.js";

export class AuthController {
  static async login(req, res, next) {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      return successResponse(res, {
        data: result,
        message: "Authentication successful",
      });
    } catch (err) {
      next(err);
    }
  }

  static async me(req, res, next) {
    try {
      const user = await AuthService.getCurrentUser(req.user.id);
      return successResponse(res, {
        data: user,
        message: "Current user retrieved",
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res) {
    return successResponse(res, {
      message: "Session ended successfully",
    });
  }
}

