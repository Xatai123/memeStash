var express = require("express"),
   router = express.Router(),
   passport = require("passport"),
   User = require("../models/user"),
   Meme = require("../models/meme"),
   async = require("async"),
   nodemailer = require("nodemailer"),
   crypto = require("crypto");

router.get("/", function (req, res) {
   res.render("landing");
});

// register
router.get("/register", function (req, res) {
   res.render("users/register", { page: "register" });
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
   res.render("users/login", { page: "login" });
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
         res.redirect("/memes")
      } else if (foundUser == null) {
         req.flash("error", "User not found");
         res.redirect("/memes")
      } else {
         Meme.find().where('author.id').equals(foundUser._id).exec(function (err, memes) {
            if (err) {
               req.flash("error", err.message);
               res.redirect("/memes")
            } else {
               res.render("users/show", { user: foundUser, memes: memes });
            }
         })
      }
   });
});

// forgot password
router.get("/forgot", function (req, res) {
   res.render("users/forgot")
});

router.post("/forgot", function (req, res, next) {
   async.waterfall([
      function (done) {
         crypto.randomBytes(20, function (err, buf) {
            var token = buf.toString('hex');
            done(err, token)
         });
      },
      function (token, done) {
         User.findOne({ email: req.body.email }, function (err, user) {
            if (!user) {
               req.flash("error", "NO account with that email address exists.");
               return res.redirect("/forgot");
            }

            console.log(token);
            
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000;

            user.save(function (err) {
               done(err, token, user);
            });
         });
      },
      function (token, user, done) {
         var smtpTransport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
               user: "thexatai@gmail.com",
               pass: process.env.GMAILPW
            },
            tls: {
               rejectUnauthorized: false
           }
         });
         var mailOptions = {
            to: user.email,
            from: "memeStash",
            subject: "memeStash Password Reset",
            text: "A password reset has been requested for " + user.username + "\n\n" +
            "click teh link below to change your password\n\n" +
               "http://" + req.headers.host + "/reset/" + token + "\n\n"
         };
         smtpTransport.sendMail(mailOptions, function (err) {
            console.log("mail sent");
            req.flash("success", "An email has been sent too " + user.email + " with further instructions");
            done(err, "done");
         });
      }
   ], function (err) {
      if (err) return next(err);
      res.redirect("/forgot");
   });
});


// reset password
router.get("/reset/:token", function (req, res) {
   User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
      if (!user) {
         req.flash("error", "Password reset token is invalid or has expired");
         return res.redirect("/forgot")
      }
      res.render("users/reset", { token: req.params.token })
   })
})

router.post("/reset/:token", function (req, res) {
   async.waterfall([
      function (done) {
         User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
            if (!user) {
               req.flash("error", "Password reset token is invalid or has expired");
               return res.redirect("back")
            }
            if (req.body.password === req.body.confirm) {
               user.setPassword(req.body.password, function (err) {
                  user.reserPasswordToken = undefined;
                  user.resetPasswordExpires = undefined;

                  user.save(function(err){
                     req.logIn(user, function(err){
                        done(err,user);
                     });
                  });
               })
            } else{
               req.flash("error", "Passwords do not match");
               return res.redirect("back");
            }
         });
      },
      function(user, done) {
         var smtpTransport = nodemailer.createTransport({
            service: "Gmail",
            auth: {
               user: "thexatai@gmail.com",
               pass: process.env.GMAILPW
            },
            tls: {
               rejectUnauthorized: false
           }
         });
         var mailOptions = {
            to: user.email,
            from: "memeStash",
            subject: "memeStash Password changed",
            text: "You changed your password. Don't forget it again or we won't change it"
         };
         smtpTransport.sendMail(mailOptions, function(err){
            req.flash("success", "Your password has been changed. Congrats idiot");
            done(err);
         });
      }
   ], function(err){
      res.redirect("/memes")
   });
});


module.exports = router;














