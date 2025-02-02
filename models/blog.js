const { Schema, model } = require("mongoose");
const slugify = require('slugify');
const marked = require('marked');
const createDomPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const dompurify = createDomPurify(new JSDOM().window);

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    markdown: {
      type: String,
      required: true,
    },
    description:{
      type: String,
    },
    coverImageURL: {
      type: String,
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    category:{
      type:String,
      required:true,
    },
    sanitizedHtml:{
      type:String,
      required:true,
    }

  },
  { timestamps: true }
);

blogSchema.pre("validate", function (next) {
  if(this.markdown){
    this.sanitizedHtml = dompurify.sanitize(marked.parse(this.markdown));
  }
  next();
});

const Blog = model("blog", blogSchema);

module.exports = Blog;
