const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
    blog: new Blog(),
  });
});
router.get('/my-blogs', async (req, res) => {
  try {
    const allBlogs = await Blog.find({ createdBy: req.user._id }); // Fetch blogs created by the logged-in user
    console.log("Blogs:", allBlogs); // Log fetched blogs
    console.log("User:", req.user);  // Log the user object
    return res.render('blogs', {
      user: req.user,
      blogs: allBlogs, // Pass blogs to the EJS template
    });
  } catch (err) {
    console.error("Error fetching blogs:", err); // Log any errors
    return res.status(500).send("An error occurred while fetching blogs.");
  }
});



router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );
  console.log("Blog ID:", req.params.id);

  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  req.blog = await Blog.findById(req.params.id);
},saveBlogAndRedirect('addBlog'));

router.get('/edit/:id',async(req,res)=>{
  const blog = await Blog.findById(req.params.id);
  return res.render('edit',{blog:blog});
})
router.put('/:id',upload.single("coverImage"), async (req, res, next) => {
  try {
    req.blog = await Blog.findById(req.params.id);
    console.log("Updating blog with ID:", req.blog._id); // Debugging line
    console.log("Received data:", req.body); // Debugging line

    // Proceed with saving updated data
    next();
  } catch (err) {
    console.error("Error finding blog:", err);
    res.status(500).send("Error finding blog to update.");
  }
}, (saveBlogAndRedirect('edit')));


router.delete('/:id',async(req,res)=>{
  await Blog.findByIdAndDelete(req.params.id);
  return res.redirect('/blog');
})
function saveBlogAndRedirect(path) {
  return async (req, res) => {
    try {
      let blog = req.blog;

      // Update the blog data only if new data is provided
      blog.title = req.body.title || blog.title;
      blog.category = req.body.category || blog.category;
      blog.description = req.body.description || blog.description;
      blog.markdown = req.body.markdown || blog.markdown;
      
      // If a new cover image is uploaded, update the cover image URL
      if (req.file) {
        blog.coverImageURL = `/uploads/${req.file.filename}`;
      }

      // Save the updated blog
      await blog.save();
      return res.redirect(`/blog/${blog._id}`);
    } catch (err) {
      console.error("Error saving blog:", err);
      res.status(500).send("Error updating blog.");
    }
  };
}




module.exports = router;