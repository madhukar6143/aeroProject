const exp = require("express");
const sellerApp = exp.Router();
sellerApp.use(exp.json());
const SellerModel = require('./model')
const db = require('../databaseConnection')
const bcryptjs=require("bcryptjs")
const stripe = require("stripe")("sk_test_51O2IaBSE8YAZ2XErYS4bFJWZkGlZTzkkrDcj1J6mJfX7PRnAB8YqYYFohQxLcfg2hJrLflKVmg1seM38bfFh2w7T00BAhULuvT")
const jwt = require("jsonwebtoken")



//All items of individual sellers
sellerApp.post("/myItems", async (req, res) => {
  try {
   
    const {  sellerId } = req.body; // Assuming you send customerId and sellerId in the request body
    const customer = await SellerModel.findById(sellerId);
    return res.status(200).json(customer.productSold)
  }
  catch(err)
  {
console.log(err)
  }
})

sellerApp.post("/login", async (req, res) => {
    try {
       
        const user = await SellerModel.findOne({ email: req.body.email });
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

sellerApp.post("/signup", async (req, res) => {
    try {
        // Retrieve the user object from the request body
        const { name, email ,role,password,phone,latitude,longitude } = req.body
        const usermail =  await SellerModel.findOne( { email : email } ) 

        if(usermail){
            return res.status(409).send({message : 'email already exists...'});
        }
        let hashedpassword =await bcryptjs.hash(password,6)
        let newpassword=hashedpassword;
        const customer = await stripe.customers.create({
            name,
            email,
            metadata: {
                role // 'seller' or 'manufacturer'
              },
        });
        const newSellerData = {
            name:name,
            email:email,
            password:newpassword,
            phone:phone,
            role:role,
            location:{
              type:"Point",
              coordinates:[latitude,longitude]
            },
            customerId: customer.id
            ,
            productSold: [],
            cart:[]
        };
      
        
        const newSeller = new SellerModel(newSellerData);
        newSeller.save()
            .then((savedSeller) => {
                return res.status(201).json({ message: 'New seller created', data: savedSeller });
            })
            .catch((error) => {
                console.log(error)
                return res.status(500).json({ message: 'Internal server error', error: error });
            });

    } catch (err) {
        console.log(err)
        return res.status(500).send({ message: "Internal server error" })
    }
});

sellerApp.post("/insert-items", async (req, res) => {
    try {
      const { itemName, pricePerItem, itemQuantity, documentId } = req.body;
  
      // Check if the item with the same name already exists in the productSold array
      const seller = await SellerModel.findById(documentId);
      const existingItem = seller.productSold.find((item) => item.item === itemName);
  
      if (existingItem) {
        // Handle the case where the item already exists
        return res.status(400).json({ message: "Item already present" });
      } else {
        // If the item doesn't exist, push the new item
        const newItem = {
          item: itemName,
          price: pricePerItem,
          quantity: itemQuantity,
        };
        const updatedDocument = await SellerModel.findByIdAndUpdate(
          documentId,
          { $push: { productSold: newItem } },
          { new: true }
        );
        return res.status(200).json({ message: "Item inserted successfully" });
      }
    } catch (err) {
      return res.status(500).send(err.message);
    }
  });
  


module.exports = sellerApp;