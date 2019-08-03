var express = require("express");
var router = express.Router({ mergeParams: true });
var Meme = require("../models/meme");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//add comment
router.get("/new", middleware.isLoggedIn, function (req, res) {
	Meme.findById(req.params.id, function (err, meme) {
		if (err) {
			console.log(err);
		} else {
			res.render("comments/new", { meme: meme });
		}
	});
});

router.post("/", middleware.isLoggedIn, function (req, res) {
	Meme.findById(req.params.id, function (err, meme) {
		if (err) {
			console.log(err);
			res.redirect("/memes");
		} else {
			Comment.create(req.body.comment, function (err, comment) {
				if (err) {
					console.log(err);
				} else {
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					comment.save();
					meme.comments.push(comment);
					meme.save();
					res.redirect("/memes/" + meme._id);
				}
			});
		}
	});
});

//update comment
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function (req, res) {
	Meme.findById(req.params.id, function (err, foundMeme) {
		if (err || !foundMeme) {
			req.flash("error", "No Meme found");
			return res.redirect("back");
		}
		Comment.findById(req.params.comment_id, function (err, foundComment) {
			if (err) {
				res.redirect("back");
			} else {
				res.render("comments/edit", { meme_id: req.params.id, comment: foundComment });
			}
		});
	})
});

router.put("/:comment_id", middleware.checkCommentOwnership, function (
	req,
	res
) {
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function (
		err,
		updatedComment
	) {
		if (err) {
			res.redirect("back");
		} else {
			res.redirect("/memes/" + req.params.id);
		}
	});
});

// delete comment
router.delete("/:comment_id", middleware.checkCommentOwnership, function (
	req,
	res
) {
	Comment.findByIdAndRemove(req.params.comment_id, function (err) {
		if (err) {
			res.redirect("back");
		} else {
			req.flash("success", "Comment deleted");
			res.redirect("/memes/" + req.params.id);
		}
	});
});

module.exports = router;
