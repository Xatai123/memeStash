var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Meme = require("../models/meme");

router.get("/", function (req, res) {
	res.render("landing");
});

// register
router.get("/register", function (req, res) {
	res.render("register", { page: "register" });
});

router.post("/register", function (req, res) {
	var newUser = new User({
		username: req.body.username,
		firstName: req.body.firstName,
		lastName: req.body.lastName,
		email: req.body.email,
		avatar: req.body.avatar
	});
	if (req.body.adminCode === "MemesAreLife") {
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, function (err, user) {
		if (err) {
			req.flash("error", err.message);
			return res.redirect("register");
		}
		passport.authenticate("local")(req, res, function () {
			req.flash("success", "Welcome to Xatai's Meme website, " + user.username);
			res.redirect("/memes");
		});
	});
});


// login
router.get("/login", function (req, res) {
	res.render("login", { page: "login" });
});

router.post(
	"/login",
	passport.authenticate("local", {
		successRedirect: "/memes",
		failureRedirect: "/login"
	}),
	function (req, res) { }
);

// logout
router.get("/logout", function (req, res) {
	req.logout();
	req.flash("error", "Logged you out");
	res.redirect("/memes");
});


// user profile
router.get("/users/:id", function (req, res) {
	User.findById(req.params.id, function (err, foundUser) {
		if (err) {
			req.flash("error", err.message);
			res.redirect("/")
		} else {
			Meme.find().where('author.id').equals(foundUser._id).exec(function (err, memes) {
				if (err) {
					req.flash("error", err.message);
					res.redirect("/")
				} else {
					res.render("users/show", { user: foundUser, memes: memes });
				}
			})
		}
	});
});

module.exports = router;
