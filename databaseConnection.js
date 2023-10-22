const mongoose = require('mongoose');

const dbURI = "mongodb+srv://madhu:madhu@clusterbackend.szevd.mongodb.net/aerodb?retryWrites=true&w=majority"

mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

module.exports = mongoose.connection;