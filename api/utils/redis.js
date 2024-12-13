// import Redis from "ioredis";
const Redis = require("ioredis");

exports.redis = new Redis(process.env.UPSTASH_URL);
