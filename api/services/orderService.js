const expressAsyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const ApiError = require("../utils/apiError");
const Order = require("../models/orderModel");
const Coupon = require("../models/couponModel");

exports.checkoutSession = expressAsyncHandler(async (req, res, next) => {
  const { products, couponCode } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return next(new ApiError("No products provided", 400));
  }

  let totalAmout = 0;

  const lineItem = products.map((product) => {
    const amout = Math.round(product.price * 100);
    totalAmout += amout * product.quantity;

    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name,
          images: [product.image],
        },
        unit_amount: amout,
      },
    };
  });

  let coupon = null;
  if (couponCode) {
    coupon = await Coupon.findOne({
      code: couponCode,
      userId: req.user._id,
      isActive: true,
    });
    if (coupon) {
      totalAmout -= Math.round((totalAmout * coupon.discountPercentage) / 100);
    }
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItem,
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/purchase-cancel`,
    customer_email: req.user.email,
    discounts: coupon
      ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }]
      : [],
    metadata: {
      userId: req.user._id,
      couponCode: couponCode || "",
      products: JSON.stringify(
        products.map((product) => {
          return {
            id: product._id,
            quantity: product.quantity,
            name: product.name,
          };
        })
      ),
    },
  });

  if (totalAmout >= 2000) {
    await createNewCoupon(req.user._id);
  }
  res.status(200).json({
    id: session.id,
    totalAmout: totalAmout / 100,
  });
});

async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });

  return coupon.id;
}

async function createNewCoupon(userId) {
  const newCoupon = await Coupon.create({
    code: "GIFT" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    discountPercentage: 10,
    expiryDate: new Date().setDate(new Date().getDate() + 7), // 7 days
    userId,
    isActive: true,
  });

  return newCoupon;
}

exports.checkoutSuccess = async (req, res) => {
  const { sessionId } = req.body;
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status === "paid") {
    if (session.metadata.couponCode) {
      await Coupon.findOneAndUpdate(
        {
          code: session.metadata.couponCode,
          userId: session.metadata.userId,
        },
        {
          isActive: false,
        }
      );
    }

    // create a new Order
    const products = JSON.parse(session.metadata.products);
    const newOrder = new Order({
      user: session.metadata.userId,
      products: products.map((product) => ({
        product: product.id,
        quantity: product.quantity,
        price: product.price,
      })),
      totalAmount: session.amount_total / 100, // convert from cents to dollars,
      stripeSessionId: sessionId,
    });

    await newOrder.save();

    res.status(200).json({
      success: true,
      message:
        "Payment successful, order created, and coupon deactivated if used.",
      orderId: newOrder._id,
    });
  }
};
