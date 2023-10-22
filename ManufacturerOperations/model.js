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
const ManuSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: Number,
  password:String,
  city: String,
  role:String,
  manuId: String,
  location:GeoSchema,
  productSold: [ProductSoldSchema]
});

// Create a model using the schema
ManuSchema.index({ location: "2dsphere" })
const ManuModel = mongoose.model('manufacturers', ManuSchema);

module.exports = ManuModel;
