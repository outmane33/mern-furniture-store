const expressAsyncHandler = require("express-async-handler");

const ApiError = require("../utils/apiError");
const Product = require("../models/productModel");
const User = require("../models/userModel");

exports.addToCart = expressAsyncHandler(async (req, res, next) => {
  const { productId } = req.body;
  const user = await User.findById(req.user._id);
  const product = await Product.findById(productId);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  if (!product) {
    return next(new ApiError("Product not found", 404));
  }
  const productIndex = user.cartItems.findIndex(
    (item) => item.product.toString() === productId
  );
  if (productIndex !== -1) {
    user.cartItems[productIndex].quantity += 1;
  } else {
    user.cartItems.push({ product: productId });
  }
  await user.save();
  res.status(200).json({
    status: "success",
    cartItems: user.cartItems,
  });
});

exports.clearCart = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  user.cartItems = [];
  await user.save();
  res.status(200).json(user.cartItems);
});

exports.updateQuantity = expressAsyncHandler(async (req, res, next) => {
  const { productId, quantity } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  const productIndex = user.cartItems.findIndex(
    (item) => item.product.toString() === productId
  );
  if (productIndex !== -1) {
    if (quantity === 0) {
      user.cartItems.splice(productIndex, 1);
    }
    user.cartItems[productIndex].quantity = quantity;
  }
  await user.save();
  res.status(200).json(user.cartItems);
});

exports.getCartProducts = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  res.status(200).json({
    status: "success",
    cartItems: user.cartItems,
  });
});

exports.deleteCartProduct = expressAsyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  const productIndex = user.cartItems.findIndex(
    (item) => item.product.toString() === id
  );
  if (productIndex !== -1) {
    user.cartItems.splice(productIndex, 1);
  }
  await user.save();
  res.status(200).json(user.cartItems);
});
