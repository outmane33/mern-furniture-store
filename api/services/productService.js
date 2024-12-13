const expressAsyncHandler = require("express-async-handler");

const ApiError = require("../utils/apiError");
const Product = require("../models/productModel");
const { redis } = require("../utils/redis");
const cloudinary = require("../utils/coudinary");

const updateFeaturedProduct = expressAsyncHandler(async (req, res, next) => {
  const products = await Product.find({ isFeatured: true }).lean();
  await redis.set("featured_products", JSON.stringify(products));
});

exports.getAllProducts = expressAsyncHandler(async (req, res, next) => {
  const products = await Product.find();
  res.status(200).json({
    status: "success",
    results: products.length,
    products,
  });
});

exports.getFeaturedProducts = expressAsyncHandler(async (req, res, next) => {
  let featuredProducts = await redis.get("featured_products");
  if (featuredProducts) {
    return res.status(200).json(JSON.parse(featuredProducts));
  }
  //lean return javascript object
  featuredProducts = await Product.find({ isFeatured: true }).lean();
  if (!featuredProducts) {
    return next(new ApiError("No featured products found", 404));
  }
  await redis.set("featured_products", JSON.stringify(featuredProducts));
  res.status(200).json(
    JSON.parse({
      status: "success",
      results: featuredProducts.length,
      products: featuredProducts,
    })
  );
});

exports.createProduct = expressAsyncHandler(async (req, res, next) => {
  const uploadResult = await cloudinary.uploader.upload(req.body.image, {
    folder: "products",
  });
  req.body.image = uploadResult.secure_url;
  const product = await Product.create(req.body);
  res.status(201).json({
    status: "success",
    product,
  });
});

exports.deleteProduct = expressAsyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError("Product not found", 404));
  }
  if (product.image) {
    const imageId = product.image.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`products/${imageId}`);
  }
  await product.remove();
  res.status(200).json({
    status: "success",
    message: "Product deleted successfully",
  });
});

exports.getRecommendedProducts = expressAsyncHandler(async (req, res, next) => {
  const products = await Product.aggregate([
    { $sample: { size: 3 } },
    { $project: { _id: 1, name: 1, description: 1, image: 1, price: 1 } },
  ]);
  res.status(200).json({
    status: "success",
    results: products.length,
    products,
  });
});

exports.getProductByCategory = expressAsyncHandler(async (req, res, next) => {
  const products = await Product.find({ category: req.params.category });
  res.status(200).json({
    status: "success",
    results: products.length,
    products,
  });
});

exports.toggleFeaturedProduct = expressAsyncHandler(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    return next(new ApiError("Product not found", 404));
  }
  product.isFeatured = !product.isFeatured;
  const updatedProduct = await product.save();
  updateFeaturedProduct();
  res.status(200).json({
    status: "success",
    product: updatedProduct,
    isFeatured: updatedProduct.isFeatured,
  });
});
