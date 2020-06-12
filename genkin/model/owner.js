/*set up model for owner, owner uploads items(products) on database
and there can be only 5 owners, owner have two categories (admin and staff)
and there can be only one owner with admin category
the admin owner can delete other owners*/

//require neccessary requirements
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcryptjs'),
    SALT_WORK_FACTOR = 10;

var ownerModelSchema = new Schema({
    isAdmin:{type: Boolean, default: false},
    username:{type: String, required: true, index: {unique: true}},
    email: {type: String, required: true, index: {unique: true}},
    password: {type:String, required: true},
    fullname: {type:String},
    isVerified: {type: Boolean, default: false},
    phone_number: {type: Number},
    createdAt: {type: Date, required: true, default: Date.now}
});
var ownertokenModelSchema = new Schema({
    _ownerId: {type: Schema.Types.ObjectId, required: true, ref: 'owner'},
    token: {type: String, required: true},
    createdAt: {type: Date, required: true, default: Date.now, expires: 43200}
});
var passwordResetSchema = new Schema({
    _ownerId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
    passwordResetToken: {type: String},
    passwordResetExpires: {type: Date, required: true, default: Date.now, expires: 43200}
});
ownerModelSchema.pre('save', function(next){
    var user = this;

    if(!user.isModified('password')) return next();
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
        if(err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err);

            user.password = hash;
            next();
        })
    })
})


//export model module
var owner = mongoose.model('owner', ownerModelSchema);
var ownerverificationtoken = mongoose.model('ownerverificationtoken', ownertokenModelSchema);
var ownerpasswordresettoken = mongoose.model('ownerpasswordresettoken', passwordResetSchema);

module.exports.owner = owner;
module.exports.ownerverificationtoken = ownerverificationtoken;
module.exports.ownerpasswordresettoken = ownerpasswordresettoken;