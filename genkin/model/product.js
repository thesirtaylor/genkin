//require mongoose
var mongoose = require('mongoose'),

//define a schema
    Schema = mongoose.Schema;

var ProductModelSchema = new Schema({
    name: {type: String, require: true},
    desc: {type: String, require: true},
    images: {type: Array, require:true},
    price: {type: Number, require: true},
    category: {type: String, require: true},
    store: {type: Schema.Types.ObjectId, required: true, ref: 'owner'},
    uploadDate: {type: Date, require: true, default: Date.now},
    uploadedby: {type: String, require: true},
});

var product = mongoose.model('product', ProductModelSchema);

module.exports.product = product;