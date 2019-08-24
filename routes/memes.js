var express = require("express");
var router = express.Router();
var Meme = require("../models/meme");
var middleware = require("../middleware");
var multer = require('multer');
var storage = multer.diskStorage({
	filename: function (req, file, callback) {
		callback(null, Date.now() + file.originalname);
	}
});
var imageFilter = function (req, file, cb) {
	// accept image files only
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
		return cb(new Error('Only image files are allowed!'), false);
	}
	cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
cloudinary.config({
	cloud_name: "xatai123cloud",
	api_key: process.env.CLOUDINARY_API,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/", function (req, res) {
	let noMatch = "";
	if (req.query.search) {
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		Meme.find({ name: regex }, function (err, foundMemes) {
			if (err) {
				console.log(err.message);
			} else {
				if (foundMemes < 1) {
					noMatch = "No match for what you are lookin for, mate."
				}

				res.render("memes/index", { memes: foundMemes, page: "memes", noMatch: noMatch });
			}
		});
	} else {
		Meme.find({}, function (err, meme) {
			if (err) {
				console.log(err.message);
			} else {
				res.render("memes/index", { memes: meme, page: "memes", noMatch: noMatch });
			}
		});
	}
});

// new meme
router.post("/", middleware.isLoggedIn, upload.single('image'), function (req, res) {
	cloudinary.uploader.upload(req.file.path, function (result) {
		// add cloudinary url for the image to the meme object under image property
		req.body.meme.image = result.secure_url;

		// add author to meme
		req.body.meme.author = {
			id: req.user._id,
			username: req.user.username
		}
		Meme.create(req.body.meme, function (err, meme) {
			if (err) {
				req.flash('error', err.message);
				return res.redirect('back');
			}
			res.redirect('/memes/' + meme.id);
		});
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

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
