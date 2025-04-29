import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: "price_1234abcd", // ← Replace with your real Stripe Price ID
          quantity: 1,
        },
      ],
      success_url: "https://your-site.com/success",
      cancel_url: "https://your-site.com/cancel",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
