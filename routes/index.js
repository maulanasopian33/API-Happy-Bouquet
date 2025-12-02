var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
    message: "API is running 🚀",
    environment: process.env.NODE_ENV || "development",
    time: new Date(),
  })
});

router.get('/test', function(req, res, next) {
  res.json({
    message: "API is running 🚀"
  })
});


module.exports = router;
