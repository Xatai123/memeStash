var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");

router.get("/", function (req, res) {
	Campground.find({}, function (err, campgrounds) {
		if (err) {
			console.log(err);
		} else {
			res.render("campgrounds/index", { campgrounds: campgrounds, page:"campgrounds" });
		}
	});
});

// new campground
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
	Campground.create(newCampgorund, function (err, campground) {
		if (err) {
			req.flash("error", "Something went wrong");
		} else {
			req.flash("success", "Successfully created Campground");
			res.redirect("/campgrounds");
		}
	});
});

router.get("/new", middleware.isLoggedIn, function (req, res) {
	res.render("campgrounds/new");
});

//show campground
router.get("/:id", function (req, res) {
	Campground.findById(req.params.id)
		.populate("comments")
		.exec(function (err, campground) {
			if (err || !campground) {
				req.flash("error", "Campground not found");
				res.redirect("/campgrounds")
			} else {
				res.render("campgrounds/show", { campground: campground });
			}
		});
});

//edit campground
router.get("/:id/edit", middleware.checkCampgroundOwnership, function (
	req,
	res
) {
	Campground.findById(req.params.id, function (err, foundCampground) {
		res.render("campgrounds/edit", { campground: foundCampground });
	});
});

router.put("/:id", middleware.checkCampgroundOwnership, function (req, res) {
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function (
		err,
		upddatedCampground
	) {
		if (err) {
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
});

//destroy campground
router.delete("/:id", middleware.checkCampgroundOwnership, function (req, res) {
	Campground.findByIdAndRemove(req.params.id, function (err) {
		if (err) {
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds");
		}
	});
});

module.exports = router;
