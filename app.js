require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const {checkForAuthenticationCookie} = require('./middlewares/auth');
const userRoute = require('./routes/user');
const blogRoute = require('./routes/blog');
const { truncateSync } = require('fs');
const Blog = require('./models/blog');
const methodOverride = require('method-override');
const app = express();

PORT =process.env.PORT||3000;

mongoose.connect(process.env.MONGO_URL)
.then(()=>console.log("Connected to MongoDB"));

app.use(express.json());
app.use(express.urlencoded({extended: truncateSync}));
app.use(express.static(path.resolve('./public')))
app.use(cookieParser());
app.use(checkForAuthenticationCookie("token"));
app.use(methodOverride('_method'));
// Middleware to set the current path
app.use((req, res, next) => {
    res.locals.currentPath = req.path; // Pass the current path to EJS
    next();
});

app.set('view engine','ejs');
app.set('views',path.resolve('./views'));

app.get('/',async (req,res)=>{
    const allBlogs = await Blog.find({});
    console.log(req.user);
    return res.render('home',{
        user:req.user,
        blogs:allBlogs,
    });
})
app.use('/user',userRoute);
app.use('/blog',blogRoute);

app.listen(PORT,()=>console.log(`Server Started at PORT : ${PORT}`));