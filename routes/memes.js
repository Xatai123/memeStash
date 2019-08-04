var express = require("express");
var router = express.Router();
var Meme = require("../models/meme");
var middleware = require("../middleware");

router.get("/", function (req, res) {
	Meme.find({}, function (err, meme) {
		if (err) {
			console.log(err.message);
		} else {
			res.render("memes/index", { memes: meme, page:"memes" });
		}
	});
});

// new meme
router.post("/", middleware.isLoggedIn, function (req, res) {
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var description = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var newCampgorund = {
		name: name,
		price: price,
		image: image,
		description: description,
		author: author
	};
	Meme.create(newCampgorund, function (err, meme) {
		if (err) {
			req.flash("error", "Something went wrong");
		} else {
			req.flash("success", "Successfully created Meme");
			res.redirect("memes");
		}
	});
});

router.get("/new", middleware.isLoggedIn, function (req, res) {
	res.render("memes/new");
});

//show meme
router.get("/:id", function (req, res) {
	Meme.findById(req.params.id)
		.populate("comments")
		.exec(function (err, meme) {
			if (err || !meme) {
				req.flash("error", "Meme not found");
				res.redirect("/memes")
			} else {
				res.render("memes/show", { meme: meme });
			}
		});
});

//edit meme
router.get("/:id/edit", middleware.checkMemeOwnership, function (
	req,
	res
) {
	Meme.findById(req.params.id, function (err, foundMeme) {
		res.render("memes/edit", { meme: foundMeme });
	});
});

router.put("/:id", middleware.checkMemeOwnership, function (req, res) {
	Meme.findByIdAndUpdate(req.params.id, req.body.meme, function (
		err,
		upddatedMeme
	) {
		if (err) {
			res.redirect("/memes");
		} else {
			res.redirect("/memes/" + req.params.id);
		}
	});
});

//destroy meme
router.delete("/:id", middleware.checkMemeOwnership, function (req, res) {
	Meme.findByIdAndRemove(req.params.id, function (err) {
		if (err) {
			res.redirect("/memes");
		} else {
			res.redirect("/memes");
		}
	});
});

module.exports = router;
