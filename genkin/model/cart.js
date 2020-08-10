//require relevant modules
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CartModelSchema = new Schema({
    _userId: {type: Schema.Types.ObjectId, required:true, ref: 'user'},
    items: [{
            _id:{type: Schema.Types.ObjectId, required:true, ref: 'product', unique: true},
            qty:{type: Number, required: true},
        }],
    address: {type: String, required: true}
})

var cart = mongoose.model('cart', CartModelSchema);
//export model module
module.exports.cart = cart;