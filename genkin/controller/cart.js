var User = require("../model/user").user,
  Cart = require("../model/cart").cart,
  Store = require("../model/owner").store,
  Product = require("../model/product").product,
  ERR = require("../commons/errorResponse"),
  SUCCESS = require("../commons/successResponse");
var mailKey = process.env.SGMAIL_APIKEY;

module.exports = {
  addtocart: (req, res) => {
    let payload = req.decoded;
    User.findOne({ _id: payload.user }, (error, user) => {
      if (error) {
        return res.status(403).json(ERR("Error encountered, user unknown"));
      }
      if (user) {
        Product.findOne({ name: req.body.name }, (error, product) => {
          if (error) {
            return res
              .status(403)
              .json(ERR("Error encountered while searching for product"));
          }
          if (product) {
            Cart.findOne(
              { "items._productId": product._id, _userId: user._id },
              (error, item) => {
                if (error) {
                  return res
                    .status(402)
                    .json(
                      ERR(
                        "Error encountered when searching for item in your Cart"
                      )
                    );
                }
                if (item) {
                  return res
                    .status(403)
                    .json(
                      ERR(
                        "We can't re-add an already existing item to your Cart"
                      )
                    );
                } else {
                  Cart.updateOne(
                    { _userId: user._id },
                    {
                      $addToSet: {
                        items: [
                          {
                            _productId: product._id,
                            qty: req.body.qty,
                            store: product.store,
                            price: product.price,
                          },
                        ],
                      },
                    },
                    { upsert: true },
                    (error, cart) => {
                      if (error) {
                        console.log(error);
                        return res
                          .status(403)
                          .json(
                            ERR(
                              "Issue encountered while trying to add item to cart"
                            )
                          );
                      }
                      if (cart) {
                        return res
                          .status(200)
                          .json(SUCCESS(product.name + " added to cart"));
                      } else {
                        return res.status(403).json(ERR("problem"));
                      }
                    }
                  );
                }
              }
            );
          } else {
            return res
              .status(401)
              .json(ERR("The product you asked for doesn't exist"));
          }
        });
      } else {
        return res.status(404).json(ERR("User does not exist."));
      }
    });
  },
  changeQty: (req, res) => {
    let payload = req.decoded;
    User.findOne({ _id: payload.user }, (error, user) => {
      if (error) {
        return res.status(404).json(ERR("Error encountered, user unknown"));
      }
      if (user) {
        Product.findOne({ name: req.body.name }, (error, product) => {
          if (error) {
            return res
              .status(402)
              .json(ERR("Error encountered while checking if product exist"));
          }
          if (product) {
            Cart.findOne(
              { "items._productId": product._id, _userId: user._id },
              (error, item) => {
                if (error) {
                  return res
                    .status(404)
                    .json(
                      ERR("Error encountered while checking for item in cart")
                    );
                }
                if (item) {
                  Cart.updateOne(
                    { "items._productId": product._id, _userId: user._id },
                    //change 'items.$.qty' to 'items.qty.$' if error occurs, version 4.4 specifications
                    { $set: { "items.$.qty": req.body.qty } },
                    (error, itemUpdate) => {
                      if (error) {
                        return res
                          .status(403)
                          .json(ERR("Item quantity update failed"));
                      } else {
                        return res
                          .status(200)
                          .json(
                            SUCCESS(
                              product.name + " changed to " + req.body.qty
                            )
                          );
                      }
                    }
                  );
                } else {
                  return res
                    .status(402)
                    .json(
                      ERR(
                        "The item you desire to update does not exist in your Cart"
                      )
                    );
                }
              }
            );
          } else {
            return res.status(402).json(ERR("This product does not exist."));
          }
        });
      } else {
        return res.status(500).json(ERR("Problem, user don't exist."));
      }
    });
  },
  removefromcart: (req, res) => {
    let payload = req.decoded;
    User.findOne({ _id: payload.user }, (error, user) => {
      if (error) {
        return res.status(404).json(ERR("Does not exist"));
      }
      if (user) {
        Product.findOne({ name: req.body.product }, (error, product) => {
          if (error) {
            return res.status(402).json(ERR("error fetching product"));
          }
          if (product) {
            Cart.findOne(
              { "items._productId": product._id, _userId: user._id },
              (error, item) => {
                if (error) {
                  return res
                    .status(403)
                    .json(
                      ERR("Error encountered while searching for item in cart")
                    );
                }
                if (item) {
                  Cart.updateOne(
                    { "items._productId": product._id, _userId: user._id },
                    { $pull: { items: { _productId: product._id } } },
                    (error, cart) => {
                      if (error) {
                        return res
                          .status(403)
                          .json(
                            ERR(
                              "Error encountered while trying to remove item from your Cart"
                            )
                          );
                      } else {
                        return res
                          .status(402)
                          .json(
                            SUCCESS(
                              product.name + " has been removed from your Cart"
                            )
                          );
                      }
                    }
                  );
                } else {
                  return res
                    .status(403)
                    .json(
                      ERR(
                        "The item you itend to remove does not exist in your Cart"
                      )
                    );
                }
              }
            );
          } else {
            return res.status(402).json(ERR("Product does not exist"));
          }
        });
      } else {
        return res.status(404).json(ERR("User does not exist."));
      }
    });
  },
  cartPricebystore: (req, res) => {
    let payload = req.decoded;
    User.findOne({ _id: payload.user }, (error, user) => {
      if (error) {
        return res
          .status(404)
          .json(ERR("Error encountered while searching for user"));
      }
      if (user) {
        Cart.findOne({ _userId: user._id }, (error, cart) => {
          if (error) {
            return res
              .status(430)
              .json(ERR("Error encountered while fetching cart"));
          }
          if (cart) {
            Cart.aggregate(
              [
                { $match: { _userId: user._id } },
                { $unwind: "$items" },
                {
                  $group: {
                    _id: "$items.store",
                    totalCartperStore: {
                      $sum: { $multiply: ["$items.price", "$items.qty"] },
                    },
                  },
                },
              ],
              (error, data) => {
                if (error) {
                  return res.status(430).json(ERR("Calculating ti fail"));
                } else {
                  return res.status(200).json(SUCCESS(data));
                }
              }
            );
          } else {
            return res
              .status(402)
              .json(ERR("Create Cart by selecting items to buy"));
          }
        });
      } else {
        return res.status(403).json(ERR("User does not exist."));
      }
    });
  },
  cartPriceTotal: (req, res) => {},
};
