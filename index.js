import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Product prices (USD cents)
const PRODUCT_PRICES = {
  singlet: 2200,
  tshirt: 2400,
  polo: 3200,
};

// Branding costs
const BRANDING_PRICES = {
  "4cm": 750,
  "6cm": 750,
  "8cm": 750,
  "10cm": 750,
  "12cm": 750,
  "14cm": 1250,
};

// Shipping prices
const SHIPPING_PRICES = {
  north: 1300,
  south: 2700,
};

app.post("/create-checkout-session", async (req, res) => {
  try {
    const { productType, brandingSize, shippingRegion, quantity } = req.body;

    if (!productType || !brandingSize || !shippingRegion || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const productPrice = PRODUCT_PRICES[productType.toLowerCase()];
    const brandingPrice = BRANDING_PRICES[brandingSize.toLowerCase()];
    const shippingPrice = SHIPPING_PRICES[shippingRegion.toLowerCase()];

    if (productPrice === undefined || brandingPrice === undefined || shippingPrice === undefined) {
      return res.status(400).json({ error: "Invalid product, branding, or shipping selection" });
    }

    // Calculate subtotal
    const subtotal = (productPrice + brandingPrice) * quantity;

    // Apply shipping cost or free shipping if subtotal > $400 (40000 cents)
    const finalShippingCost = subtotal >= 40000 ? 0 : shippingPrice;

    // Total charge
    const totalAmount = subtotal + finalShippingCost;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Custom Order - ${productType.toUpperCase()} with ${brandingSize} branding`
            },
            unit_amount: totalAmount
          },
          quantity: 1,
        },
      ],
      success_url: "https://your-frontend-domain.com/payment-success.html",
      cancel_url: "https://your-frontend-domain.com/payment-cancel.html",
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
