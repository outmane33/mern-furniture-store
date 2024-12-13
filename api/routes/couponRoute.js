const express = require("express");
const { protect } = require("../services/authService");
const { getCoupon, validateCoupon } = require("../services/couponService");
const router = express.Router();

router.route("/").get(protect, getCoupon);
router.route("/validate").post(protect, validateCoupon);

module.exports = router;
