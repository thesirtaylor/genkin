//require mongoose
var mongoose  = require('mongoose'),
//define schema
    Schema = mongoose.Schema,
//require bcrpyt for password encryption
    bcrypt = require('bcryptjs'),
//salt_work_factor also for encryption
    SALT_WORK_FACTOR = 10;


    //create schema for model 

var userModelSchema = new Schema({
    email: {type: String, required: true, index: {unique: true}},
    password: {type:String, required: true},
    fullname: {type: String},
    isVerified: {type: Boolean, default: false},
    phone_number: {type: Number},

});
var tokenModelSchema = new Schema({
    _userId: {type: Schema.Types.ObjectId, required:true, ref: 'user'},
    token: {type:String, required: true},
    createdAt: {type: Date, required: true, default: Date.now, expires: 43200}//expires after 12 hours
});
var passwordResetSchema = new Schema({
    _userId: {type: Schema.Types.ObjectId, required: true, ref: 'user'},
    token: {type: String, required: true},
    passwordResetExpires: {type: Date, required: true, default: Date.now, expires: 43200}
});

userModelSchema.pre('save', function(next){
    var user = this;
    //only hash the password if it has been modified or it is new
    if(!user.isModified('password')) return next();
    //generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
        if(err) return next(err);
        //hash password using the new salt
        bcrypt.hash(user.password, salt, function(err, hash){
            if(err) return next(err);
            //override the cleartext password with the hashed one
            user.password = hash;
            next();
            /*
            simplifying the bcrypt.hash code block
            bcrypt.hash(user.password, salt, (err, hash)=>{
                if(err) {
                    return next(err)
                }else{
                    user.password = hash;
                    next();
                }
            })
            */

        });
    });
});
/**userModelSchema.methods.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

//create a method to compare if the hashpassword matches the inputed text

userModelSchema.methods.comparePassword = function(userpassword, callback){
    var user = this;
    bcrypt.compare(userpassword, user.password, function(error, isMatch){
        if(error){
             return callback(error)
            }else{
                callback(null, isMatch);
            }        
    });
};
**/

//create a method that splits user full name to return only firstname
userModelSchema.methods.splitNames = function(){
    return this.fullname.split(" ")[0];
}

var user = mongoose.model('user', userModelSchema);
var userverificationtoken = mongoose.model('userverificationtoken', tokenModelSchema);
var userpasswordresettoken = mongoose.model('userpasswordresettoken', passwordResetSchema);

module.exports.user = user;
module.exports.userverificationtoken = userverificationtoken;
module.exports.userpasswordresettoken = userpasswordresettoken;