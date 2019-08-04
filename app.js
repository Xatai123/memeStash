const express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    flash = require("connect-flash"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    User = require("./models/user");

const commentRoutes = require("./routes/comments"),
    memeRoutes = require("./routes/memes"),
    authRoutes = require("./routes/auth");
    
mongoose.connect(process.env.DATABASEURL, {
    useNewUrlParser: true,
    useCreateIndex: true
}).then(() => {
    console.log("connected do db");
}).catch(err => {
    console.log("ERROR: ", err.message);
})

app.use(bodyParser.urlencoded({
    extended: true
}));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(
    require("express-session")({
        secret: "this is a secret",
        resave: false,
        saveUninitialized: false
    })
);
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(authRoutes);
app.use("/memes/:id/comments", commentRoutes);
app.use("/memes", memeRoutes);

app.listen(process.env.PORT, process.env.IP, function () {
    console.log("Yelpcamp started");
});