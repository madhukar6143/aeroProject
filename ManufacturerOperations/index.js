const exp = require("express");
const manuApp = exp.Router();
manuApp.use(exp.json());
const ManuModel = require("./model")
const SellerModel = require("../SellerOperations/model")
const db = require('../databaseConnection')
const bcryptjs = require("bcryptjs")
const stripe = require("stripe")("sk_test_51O2IaBSE8YAZ2XErYS4bFJWZkGlZTzkkrDcj1J6mJfX7PRnAB8YqYYFohQxLcfg2hJrLflKVmg1seM38bfFh2w7T00BAhULuvT")
const jwt = require("jsonwebtoken")






manuApp.post("/login", async (req, res) => {
    try {
      const user = await ManuModel.findOne({ email: req.body.email });
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



manuApp.post("/signup", async (req, res) => {
    try {
        // Retrieve the user object from the request body
        const { name, email ,role,password,phone,latitude,longitude } = req.body
        const usermail =  await ManuModel.findOne( { email : email } ) 

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
        const newManuData = {
            name:name,
            email:email,
            password:newpassword,
            phone:phone,
            role:role,
            location:{
              type:"Point",
              coordinates:[latitude,longitude]
            },
            manuId: customer.id
            ,
            productSold: []
        };
      
        
        const newManu = new ManuModel(newManuData);
        newManu.save()
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


module.exports = manuApp;