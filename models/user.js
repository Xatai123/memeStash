var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    avatar: String,
    firstName: String,
    lastName: String,
    email: String,
    createdAt: { type: Date, default: Date.now },
    isAdmin: { type: Boolean, default: false }
})

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);