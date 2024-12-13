const expressAsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const { redis } = require("../utils/redis");

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    60 * 60 * 24 * 7
  ); //7 days
};

const setCookies = (res, accessToken, refreshToken) => {
  res.cookie("access_token", accessToken, {
    httpOnly: true, //prevent xss attacks
    sameSite: "strict", //prevent csrf attacks
    secure: process.env.NODE_ENV === "production",
    maxAge: 15 * 60 * 1000, //15 minutes
  });
  res.cookie("refresh_token", refreshToken, {
    httpOnly: true, //prevent xss attacks
    sameSite: "strict", //prevent csrf attacks
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000, //7 days
  });
};

exports.signUp = expressAsyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
  });

  //authentication
  const { accessToken, refreshToken } = generateTokens(user._id);
  await storeRefreshToken(user._id, refreshToken);
  setCookies(res, accessToken, refreshToken);

  res.status(201).json({
    status: "success",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

exports.login = expressAsyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await user.comparePassword(req.body.password))) {
    return next(new ApiError("Invalid email or password", 401));
  }
  const { accessToken, refreshToken } = generateTokens(user._id);
  await storeRefreshToken(user._id, refreshToken);
  setCookies(res, accessToken, refreshToken);
  res.status(200).json({
    status: "success",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

exports.logout = expressAsyncHandler(async (req, res, next) => {
  const refresh_token = req.cookies.refresh_token;
  if (refresh_token) {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
    await redis.del(`refresh_token:${decoded.userId}`);
  }
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

exports.refreshToken = expressAsyncHandler(async (req, res, next) => {
  const refresh_token = req.cookies.refresh_token;
  if (!refresh_token) {
    return next(new ApiError("Unauthorized", 401));
  }

  const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);
  const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

  if (!storedToken || storedToken !== refresh_token) {
    return next(new ApiError("Unauthorized", 401));
  }
  const access_token = jwt.sign(
    { userId: decoded.userId },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "15m",
    }
  );
  setCookies(res, access_token, storedToken);

  res.status(200).json({
    status: "success",
  });
});

exports.checkAuth = expressAsyncHandler(async (req, res, next) => {
  res.status(200).json({
    status: "success",
    user: {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

exports.protect = expressAsyncHandler(async (req, res, next) => {
  //get token
  const token = req.cookies.access_token;
  if (!token) {
    return next(new ApiError("Unauthorized - No token provided", 401));
  }

  //verify token
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decoded.userId).select("-password");
  if (!user) {
    return next(new ApiError("Unauthorized - User not found", 401));
  }

  req.user = user;
  next();
});

exports.allowTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
