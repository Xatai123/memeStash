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
	cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
		if (err) {
			req.flash("error", err.message);
			return redirect("back");
		}
		req.body.meme.image = result.secure_url;
		req.body.meme.imageId = result.public_id;

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
router.get("/:id/edit", middleware.checkMemeOwnership, function (req, res) {
	Meme.findById(req.params.id, function (err, foundMeme) {
		res.render("memes/edit", { meme: foundMeme });
	});
});

router.put("/:id", middleware.checkMemeOwnership, upload.single('image'), function (req, res) {
	Meme.findById(req.params.id, async function (err, upddatedMeme) {
		if (err) {
			req.flash("error", err.message)
			res.redirect("back");
		} else {
			if (req.file) {
				try {
					await cloudinary.v2.uploader.destroy(upddatedMeme.imageId);
					let result = await cloudinary.v2.uploader.upload(req.file.path);
					upddatedMeme.imageId = result.public_id;
					upddatedMeme.image = result.secure_url;
				} catch (err) {
					req.flash("error", err.message)
					return res.redirect("back");
				}
			}
			upddatedMeme.name = req.body.name;
			upddatedMeme.description = req.body.description;
			upddatedMeme.save();

			req.flash("success", "Succesfully updated meme")
			res.redirect("/memes/" + req.params.id);
		}
	});
});

//destroy meme
router.delete("/:id", middleware.checkMemeOwnership, function (req, res) {
	Meme.findById(req.params.id, async function (err, foundMeme) {
		if (err) {
			req.flash("error", err.message)
			return res.redirect("back");
		}
		try {
			await cloudinary.v2.uploader.destroy(foundMeme.imageId);
			foundMeme.remove();
			req.flash("success", "Succesfully deleted Meme");
			res.redirect("/memes");
		} catch (err) {
			req.flash("error", err.message)
			return res.redirect("back");
		}
	});
});

function escapeRegex(text) {
	return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
