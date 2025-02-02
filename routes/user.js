const { Router } = require("express");
const User = require("../models/user");
const multer = require("multer");
const path = require("path");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/images/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.get("/signin", (req, res) => {
  return res.render("signin");
});

router.get("/signup", (req, res) => {
  return res.render("signup");
});

router.post("/signin", async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);

    return res.cookie("token", token).redirect("/");
  } catch (error) {
    return res.render("signin", {
      error: "Incorrect Email or Password",
    });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/");
});

router.get("/profile",(req,res)=>{
  const user = req.user;
  return res.render("profile",{user});
});

router.get("/profile/edit",(req,res)=>{
  const user = req.user;
  return res.render("edit",{user});
});


router.post('/profile/edit', upload.single('profileImageURL'), async (req, res) => {
  try {
      const { fullName, about } = req.body;
      const userId = req.user._id; // Assuming req.user contains the authenticated user

      const updateData = { fullName, about };

      if (req.file) {
          updateData.profileImageURL = `/images/${req.file.filename}`;
      }

      // Update the user in the database
      await User.findByIdAndUpdate(userId, updateData, { new: true });

      // Fetch the updated user and render the profile page
      const updatedUser = await User.findById(userId);
      const user = updatedUser
      return res.redirect('/');
  } catch (error) {
      console.error(error);
      res.status(500).send('Server Error');
  }
});

router.post("/signup",upload.single("profileImageURL"), async (req, res) => {
  const { fullName, email, password } = req.body;
  await User.create({
    fullName,
    email,
    password,
    profileImageURL: `/images/${req.file.filename}`,
  });
  return res.redirect("/");
});

module.exports = router;
