//require mongoose
var mongoose = require('mongoose'),

//define a schema
    Schema = mongoose.Schema;

var ProductModelSchema = new Schema({
    name: {type: String, required: true},
    desc: {type: String, required: true},
    images: {type: Array, required:true},
    price: {type: Number, required: true},
    category: {type: String, required: true},
    store: {type: Schema.Types.ObjectId, required: true, ref: 'owner'},
    uploadDate: {type: Date, required: true, default: Date.now},
    uploadedby: {type: String, required: true},
});

var product = mongoose.model('product', ProductModelSchema);

module.exports.product = product;