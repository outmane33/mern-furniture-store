const express = require("express");
const {
  getAllProducts,
  getFeaturedProducts,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductByCategory,
  toggleFeaturedProduct,
} = require("../services/productService");
const { allowTo, protect } = require("../services/authService");
const {
  createProductValidator,
  deleteProductValidator,
  getProductByCategoryValidator,
  toggleFeaturedProductValidator,
} = require("../utils/validators/productValidator");
const router = express.Router();

router
  .route("/")
  .get(protect, allowTo("admin"), getAllProducts)
  .post(protect, allowTo("admin"), createProductValidator, createProduct);
router.route("/featured").get(getFeaturedProducts);
router.route("/recommended").get(getRecommendedProducts);
router
  .route("/category/:category")
  .get(getProductByCategoryValidator, getProductByCategory);

router
  .route("/:id")
  .delete(protect, allowTo("admin"), deleteProductValidator, deleteProduct)
  .put(
    protect,
    allowTo("admin"),
    toggleFeaturedProductValidator,
    toggleFeaturedProduct
  );

module.exports = router;
