const mongoose = require('mongoose');






// Create a schema for ProductsSold
const ProductSoldSchema = new mongoose.Schema({
  item: String,
  price: Number,
  quantity: Number
});

//Location Schema
const GeoSchema = new mongoose.Schema({
    type: {
      type: String,
      default: "Point",
    },
    coordinates: {
      type: [Number], //the type is an array of numbers
    }
  })

// Create a schema for Seller
const SellerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: Number,
  password:String,
  city: String,
  role:String,
  sellerId: String,
  location:GeoSchema,
  productSold: [ProductSoldSchema],
  cart:[ProductSoldSchema]
});

// Create a model using the schema
SellerSchema.index({ location: "2dsphere" })
const SellerModel = mongoose.model('sellers', SellerSchema);


module.exports = SellerModel;
