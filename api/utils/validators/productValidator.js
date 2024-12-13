const { check } = require("express-validator");
const ApiError = require("../apiError");
const validatorMiddleware = require("../../middlewares/validatorMiddleware");
const Product = require("../../models/productModel");

exports.createProductValidator = [
  check("name")
    .notEmpty()
    .withMessage("Product name is required")
    .isLength({ min: 3 })
    .withMessage("Product name must be at least 3 characters"),
  check("description")
    .notEmpty()
    .withMessage("Product description is required"),
  check("price")
    .notEmpty()
    .withMessage("Product price is required")
    .isNumeric()
    .withMessage("Product price must be a number"),
  check("image").notEmpty().withMessage("Product image is required"),
  check("category").notEmpty().withMessage("Product category is required"),
  validatorMiddleware,
];

exports.deleteProductValidator = [
  check("id").notEmpty().withMessage("Product id is required"),
  validatorMiddleware,
];

exports.getProductByCategoryValidator = [
  check("category").notEmpty().withMessage("Product category is required"),
  validatorMiddleware,
];

exports.toggleFeaturedProductValidator = [
  check("id").notEmpty().withMessage("Product id is required"),
  validatorMiddleware,
];
