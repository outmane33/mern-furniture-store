const expressAsyncHandler = require("express-async-handler");

const ApiError = require("../utils/apiError");
const Coupon = require("../models/couponModel");

exports.getCoupon = expressAsyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true });

  res.status(200).json({
    status: "success",
    coupon: coupon || null,
  });
});

exports.validateCoupon = expressAsyncHandler(async (req, res, next) => {
  const coupon = await Coupon.findOne({
    code: req.body.code,
    userId: req.user._id,
    isActive: true,
  });

  if (!coupon) {
    return next(new ApiError("Invalid coupon code", 400));
  }

  if (new Date(coupon.expiryDate) < new Date()) {
    coupon.isActive = false;
    await coupon.save();
    return next(new ApiError("Coupon has expired", 400));
  }

  res.status(200).json({
    status: "success",
    message: "Coupon is valid",
    code: coupon.code,
    discountPercentage: coupon.discountPercentage,
  });
});
