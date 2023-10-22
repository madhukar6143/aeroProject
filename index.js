const express =require('express');
const sellerApp =require("./SellerOperations/index")
const customerApp = require("./CustomersOperations/index")
const manuApp = require("./ManufacturerOperations/index")
const app = express();
const cors = require("cors"); 
const stripe = require("stripe")("sk_test_51O2IaBSE8YAZ2XErYS4bFJWZkGlZTzkkrDcj1J6mJfX7PRnAB8YqYYFohQxLcfg2hJrLflKVmg1seM38bfFh2w7T00BAhULuvT")

const port = 3000;

app.use(express.json()); 
const corsOptions = {
  origin: "*",
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200
}

app.use(cors(corsOptions));
// Route to handle incoming data

app.get('/', (req, res) => {
    res.send("Yeah Iam alive")
})

app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const { product} = req.body;
    const {  customerId, productOwner } = req.body.product;
console.log(customerId,productOwner)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name: product.name,
            },
            unit_amount: product.price * 100,
          },
          quantity: product.quantity,
        },
      ],
      mode: "payment",
      success_url: `http://localhost:3000/customer/clear-cart?customerId=${customerId}&sellerId=${productOwner}`,
      cancel_url: "http://localhost:3001/cancel",
    });
console.log(session)
    // Check the status of the payment_intent
    if (session.payment_intent && session.payment_intent.status === "succeeded") {
      // Payment was successful
      // Perform actions like updating the database, sending emails, and removing items from the cart
      console.log("Payment successful");

      // Example: Remove cart items for the customer and seller
      console.log("Customer ID:", customerId);
      console.log("Seller ID:", sellerId);

      // Send a success response
      res.json({ id: session.id, status: "success" });
    } else {
      // Payment failed or has a different status
      console.log("Payment failed");

      // Send an error response
      res.json({ id: session.id, status: "failure" });
    }
  } catch (err) {
    console.log("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});


//execute routes based on path
app.use("/seller",sellerApp)
app.use("/customer",customerApp)
app.use("/manufacturer",manuApp)





app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});



