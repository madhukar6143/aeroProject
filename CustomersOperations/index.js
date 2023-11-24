const exp = require("express");
const customerApp = exp.Router();
const axios = require('axios')
customerApp.use(exp.json());
const customerModel = require("./model")
const SellerModel = require("../SellerOperations/model")
const db = require('../databaseConnection')
const bcryptjs = require("bcryptjs")
const stripe = require("stripe")("sk_test_51O2IaBSE8YAZ2XErYS4bFJWZkGlZTzkkrDcj1J6mJfX7PRnAB8YqYYFohQxLcfg2hJrLflKVmg1seM38bfFh2w7T00BAhULuvT")
const jwt = require("jsonwebtoken")

customerApp.post("/search-items", async (req, res) => {
  try {
    const pointA = req.body.location;
    console.log(pointA)
    const sellers = await SellerModel.find({
      location: {
        $near: {
          $geometry: pointA,
          $maxDistance: 50000, // 50 kilometers in meters
        },
      },
    })
    return res.status(200).send({ message: sellers });
  } catch (error) {
    console.error('Error querying sellers:', error);
  }
});



customerApp.post("/items", async (req, res) => {
  try {
    const { sellerId } = req.body
    console.log(sellerId,"req",req.body);
    const items = await SellerModel.findById(sellerId);
    return res.status(200).json(items.productSold);
  } catch (error) {
    console.error('Error querying sellers:', error);
  }
})

customerApp.post("/cartItems", async (req, res) => {
  try {
    const { customerId, sellerId } = req.body.myData; // Assuming you send customerId and sellerId in the request body
    if(customerId===null)
      return res.send({message:"there is problem please login again"});
    console.log(req.body)
    const customer = await customerModel.findById(customerId);
    if(customer && sellerId===null)
     return res.status(200).json(customer.cart);
        // Find the seller's cart based on sellerId
        const sellerCart = customer.cart.find((cart) => cart.sellerId === sellerId);
        const items = []
        if (!sellerCart) {
          return res.json(items);
        }
        // Retrieve the items for the specific seller
         items = sellerCart.items;
    
        return res.status(200).json(items)
  } catch (error) {
    console.error('Error querying customer cart:', error);
    return res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});



customerApp.post("/insertInCart", async (req, res) => {

  const { customerId, sellerId, cartItem } = req.body
  try {
    // Find the customer by customerId
    const customer = await customerModel.findById(customerId);

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const cartIndex = customer.cart.findIndex(cartItem => cartItem.sellerId === sellerId);

    if (cartIndex === -1) {
      // If the sellerId doesn't exist, create a new entry for the seller
      customer.cart.push({ sellerId, items: [cartItem] });
    } else {
      // If the sellerId exists, check if the item with the same name already exists
      const itemIndex = customer.cart[cartIndex].items.findIndex(
        item => item.item === cartItem.item
      );

      if (itemIndex === -1) {
        // If the item doesn't exist for the seller, add it to the cart
        customer.cart[cartIndex].items.push(cartItem);
      } else {
        // If the item exists, update its quantity
        customer.cart[cartIndex].items[itemIndex].quantity += cartItem.quantity;
      }
    }
    // Save the customer's updated cart
    await customer.save();

    return res.status(200).json({ message: "Item added to cart" });
  } catch (error) {
    console.error('Error querying customer cart:', error);
    return res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});

customerApp.post("/updateCart", async (req, res) => {
  const { customerId, sellerId, cartItem } = req.body;
  
  try {
    const customer = await customerModel.findById(customerId);
    const cartIndex = customer.cart.findIndex(cartItem => cartItem.sellerId === sellerId);

    if (cartIndex !== -1) {
      const itemIndex = customer.cart[cartIndex].items.findIndex(item => item.item === cartItem.item);

      if (itemIndex !== -1) {
        if (cartItem.quantity > 0) {
          // Increment the item quantity
          customer.cart[cartIndex].items[itemIndex].quantity = cartItem.quantity;
        } else {
          // Remove the item if quantity is zero or less
          customer.cart[cartIndex].items.splice(itemIndex, 1);
        }
      } else if (cartItem.quantity > 0) {
        // Add a new item to the cart if it doesn't exist
        customer.cart[cartIndex].items.push(cartItem);
      }
    }

    // Save the customer's updated cart
    await customer.save();
    return res.status(200).json({ message: "Cart updated successfully" });
  } catch (error) {
    console.error('Error updating customer cart:', error);
    return res.status(500).json({ error: 'An error occurred while updating the cart.' });
  }
});



customerApp.post("/removeFromCart", async (req, res) => {
  try {
    const { customerId, sellerId, cartItem } = req.body;
    const customer = await customerModel.findById(customerId);

    // Find the seller's cart
    const cartIndex = customer.cart.findIndex((cart) => cart.sellerId === sellerId);

    if (cartIndex !== -1) {
      const sellerCart = customer.cart[cartIndex].items;

      // Find the item in the seller's cart
      const itemIndex = sellerCart.findIndex((item) => item.item === cartItem.item);

      if (itemIndex !== -1) {
        // Remove the item by splicing it from the array
        sellerCart.splice(itemIndex, 1);
      }
 
    if (sellerCart.length === 0) {
      customer.cart.splice(cartIndex, 1);
    }
  }

    // Save the customer's updated cart
    await customer.save();
    return res.status(200).json({ message: "Item removed from cart" });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    return res.status(500).json({ error: 'An error occurred while removing the item from the cart.' });
  }
});


customerApp.post("/listAllItems", async (req, res) => {
  try {
    const pointA = req.body.location;
    console.log("isthat is", pointA)
    const sellers = await SellerModel.find({})
    const allItems = sellers.flatMap((seller) => {
      return seller.productSold.map((product) => ({
        item: product.item,
        price: product.price,
        quantity: product.quantity, // Replace with the actual quantity property
        seller: seller.name,
        sellerId: seller._id
      }));
    });
    return res.status(200).json({ allItems });
  } catch (error) {
    console.error('Error querying sellers:', error);
  }
});

// Define the route and the HTTP method to handle

customerApp.get('/clear-cart', async(req, res) => {
  try
  {
    console.log("here")
  const { customerId, sellerId } = req.query;
  const customer = await customerModel.findById(customerId);
  // Find the seller's cart
  const cartIndex = customer.cart.findIndex((cart) => cart.sellerId === sellerId);
  console.log(cartIndex,"cartIndex")
    customer.cart.splice(cartIndex, 1);
  await customer.save();
  return res.redirect('http://localhost:3001/home');
  } catch (error) {
    return res.redirect('http://localhost:3001/home');
  }
});


customerApp.post("/order-items", async (req, res) => {
  try {


    return res.status(200).send({ message: sellers });

  } catch (error) {
    console.error('Error querying sellers:', error);
  }
});



// Define the route and the HTTP method to handle
customerApp.post("/signup", async (req, res) => {
  try {
    // Retrieve the user object from the request body
    const { name, email, role, password, phone, city, latitude, longitude } = req.body
    const usermail = await customerModel.findOne({ email: email })
    if (usermail) {
      return res.status(409).send({ message: 'email already exists...' });
    }
    let hashedpassword = await bcryptjs.hash(password, 6)
    let newpassword = hashedpassword;
    const customer = await stripe.customers.create({
      name,
      email,
      metadata: {
        role // 'customer'
      },
    });
    const newCustomerData = {
      name: name,
      email: email,
      password: newpassword,
      phone: phone,
      city: city,
      role: role,
      customerId: customer.id,
      location: {
        type: "Point",
        coordinates: [latitude, longitude]
      },
      cart: []
    };

    const newCustomer = new customerModel(newCustomerData);
    newCustomer.save()
      .then((savedCustomer) => {
        return res.status(201).json({ message: 'New Customer created', data: savedCustomer });
      })
      .catch((error) => {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error', error: error });
      });

  } catch (err) {

    return res.status(500).send({ message: "Internal server error" })
  }
});

customerApp.post("/login", async (req, res) => {
  try {
    const user = await customerModel.findOne({ email: req.body.email });
    if (user === null) {
      return res.status(400).json({ message: "Invalid username" })
    }
    let result = await bcryptjs.compare(req.body.password, user.password)
    //if not matched
    if (result === false) {
      return res.status(400).json({ message: "Invalid password" })
      // Send a 200 status with the success message
    }
    let tokened = jwt.sign({ userName: user.email }, 'mysecretkey', { expiresIn: 100000 })

    return res.status(200).json({ message: "Login successful", token: tokened, user: user })
  } catch (err) {
    return res.status(500).send(err.message);
  }
});
module.exports = customerApp;
