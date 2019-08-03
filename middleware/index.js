var Meme = require("../models/meme");
var Comment = require("../models/comment");
var middlewareObj = {};

middlewareObj.checkMemeOwnership = function (req, res, next) {
	if (req.isAuthenticated()) {
		Meme.findById(req.params.id, function (err, foundMeme) {
			if (err || !foundMeme) {
				req.flash("error", "Meme not found");
				res.redirect("back");
			} else {
				if (foundMeme.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.checkCommentOwnership = function (req, res, next) {
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, function (err, foundComment) {
			if (err || !foundComment) {
				req.flash("error", "Comment not found");
				res.redirect("back");
			} else {
				if (foundComment.author.id.equals(req.user._id)) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		res.redirect("back");
		req.flash("error", "You need to be logged in to do that");
	}
};

middlewareObj.isLoggedIn = function (req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
};

module.exports = middlewareObj;