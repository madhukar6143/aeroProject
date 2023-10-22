expApp.post("/signup", async (req, res) => {
    try {
        // Retrieve the user object from the request body
        const { name, email ,role,password,phone,latitude,longitude } = req.body
        const customer = await stripe.customers.create({
            name,
            email,
            metadata: {
                role // 'seller' or 'manufacturer'
              },
        });
        const newCustomerData = {
            name:name,
            email:email,
            password:password,
            phone:phone,
            location:{
              type:"Point",
              coordinates:[latitude,longitude]
            },
            bankAccount: {
                customerId: customer.id
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
      
      }  catch (err) {
              
              return res.status(500).send({message:"Internal server error"})
            }
          });
      


module.exports = expApp;