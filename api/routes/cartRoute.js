const express = require("express");
const router = express.Router();
const { protect, allowTo } = require("../services/authService");
const {
  addToCart,
  clearCart,
  updateQuantity,
  getCartProducts,
  deleteCartProduct,
} = require("../services/cartService");

router
  .route("/")
  .post(protect, addToCart)
  .delete(protect, clearCart)
  .get(protect, getCartProducts)
  .put(protect, updateQuantity);
router.route("/:id").delete(protect, deleteCartProduct);

module.exports = router;
