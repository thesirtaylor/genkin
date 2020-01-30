//require mongoose
var mongoose = require('mongoose'),

//define a schema
    Schema = mongoose.Schema;

var ProductModelSchema = new Schema({
    product_id:{type: Number, require: true},
    name: {type: String, require: true},
    desc: {type: String, require: true},
    quantity: {type: Number, require: true},
    price: {type: Number, require: true},
    fashionCategory: {type: String, require: true},
    uploadDate: {type: Date}
});

var product = mongoose.model('product', ProductModelSchema);

module.exports.product = product;