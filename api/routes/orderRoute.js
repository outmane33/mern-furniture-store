const express = require("express");
const {
  checkoutSession,
  checkoutSuccess,
} = require("../services/orderService");
const { protect } = require("../services/authService");
const router = express.Router();

router.route("/checkout-session").post(protect, checkoutSession);
router.route("/checkout-success").post(protect, checkoutSuccess);

module.exports = router;
