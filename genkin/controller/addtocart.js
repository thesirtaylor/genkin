//all the codes here are for research purpose


const { reject } = require("q");

var User = require("../model/user").user,
  Cart = require("../model/user").cart,
  Store = require("../model/owner").store,
  Product = require("../model/product").product,
  ERR = require("../commons/errorResponse"),
  SUCCESS = require("../commons/successResponse");
var mailKey = process.env.SGMAIL_APIKEY;

module.exports = {
  addtocart: async (req, res) => {
    let payload = req.decoded;
    try {
      const allPromises = [
        User.findOne({ _id: payload.user }),
        Product.findOne({ name: req.body.name }),
      ];

      const [user, product] = await Promise.all(allPromises);

      const cart = await Cart.findOne({
        "items._id": product._id,
        _id: user._id,
      });

      if (cart) {
        console.log("It works!");
        return res.status(403).json(ERR('Product already exists in cart'));
      }

      console.log(product.price, product.store)
      let item = {
        _id: product._id,
        qty: req.body.qty,
        store: product.store,
        price: product.price,
      };
      const updatedCart = await Cart.updateOne(
        { _id: user._id },
        {
          $push: { 
           items: item
          },
        },
        { upsert: true }
      );

      //console.log(JSON.stringify(updatedCart))

      return res.status(200).json(SUCCESS(product.name + " added to cart"));




    } catch (error) {
      console.log(error);
      return res.status(404).json(ERR(cart));
    }
    // User.findOne({ _id: payload.user}).then((user) => {
    //     if (user) {
    //         return Product.findOne({ name: req.body.name })
    //     }
    // }).then((product) => {
    //     if (product) {
    //         return Cart.findOne()
    //     }
    // }).then((cart) => {

    // })
  },
  anotherend:(options)=>{
    return new Promise(async (resolve, reject)=>{
      try {
        let bcrypt = bcrypt.compare(options.password, owner.password)
        if(bcrypt)return resolve(bcrypt);
      } catch (error) {
        return reject(error)
      }
    })
  }
};

module.exports = {
  exportss:(options, cb)=>{
      anotherend(options)
      .then(res => cb(null, res))
      .catch(err=> cb({}))
  }
}
