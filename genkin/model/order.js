//require relevant modules
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var OrderModelSchema = new Schema({
    order_id: {type: Number, require: true},
    product_id:{type: Number, require: true},
    product_order_quantity: {type: Number, require: true},
    email: {type: String, require: true}
})

var order = mongoose.model('order', OrderModelSchema);
//export model module
module.exports.order = order;