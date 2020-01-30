//import requirements

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var DeliverModelSchema = new Schema({
    order_id: {type: Number, require: true},
    delivery_address: {type: String},
    phone_number: {type: Number},
    email: {type: String}
});

var delivery = mongoose.model('delivery', DeliverModelSchema);

//export model module
module.exports.delivery = delivery;