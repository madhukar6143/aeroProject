const jwt=require("jsonwebtoken")
require('dotenv').config();
const secretKey = 'mysecretkey';

const authMiddleware = async (req, res, next) => {
  try {
   const token = req.headers.authorization.split(' ')[1];

    // Verify the token using the secret key
  const decoded = await jwt.verify(token, secretKey);

   // Add the decoded user information to the request object
   req.user = decoded;
    // Call the next middleware function
    next();
  } catch (err) {
    console.log("exception", err.message)
    // Return an error if the token is not valid
    res.status(401).json({ message: 'Invalid token && Session Expired please Login to continue' });
  }
};

module.exports=authMiddleware