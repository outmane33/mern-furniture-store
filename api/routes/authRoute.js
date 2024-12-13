const express = require("express");
const {
  signUp,
  logout,
  login,
  refreshToken,
  checkAuth,
  protect,
} = require("../services/authService");
const {
  sinUpValidator,
  loginValidator,
} = require("../utils/validators/authValidator");
const router = express.Router();

router.post("/signup", sinUpValidator, signUp);
router.post("/login", loginValidator, login);
router.post("/logout", logout);
router.get("/profile", protect, checkAuth);
router.post("/refresh-token", refreshToken);

module.exports = router;
