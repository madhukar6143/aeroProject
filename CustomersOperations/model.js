const mongoose = require('mongoose');


const ProductSoldSchema = new mongoose.Schema({
  item: String,
  price: Number,
  quantity: Number,
});

// Location Schema
const GeoSchema = new mongoose.Schema({
  type: {
    type: String,
    default: "Point",
  },
  coordinates: {
    type: [Number],
  },
});

// Create a schema for Customer
const CustomerSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: Number,
  password: String,
  city: String,
  role: String,
  customerId: String,
  location: GeoSchema,
  cart: [
    {
      sellerId: String, // Unique identifier for the seller
      items: [
        {
          item: String,
          price: Number,
          quantity: Number,
        },
      ],
    },
  ],
});

// Create a model using the schema
CustomerSchema.index({ location: "2dsphere" });
const customerModel = mongoose.model('customers', CustomerSchema);

module.exports = customerModel;
