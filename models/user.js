const { createHmac, randomBytes } = require("node:crypto");
const { Schema, model } = require('mongoose');
const { createTokenForUser } = require('../services/auth');

const userSchema = new Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  salt: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  profileImageURL: {
    type: String,
    default: '/images/default.png',
  },
  about: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER',
  }
}, { timestamps: true });

// Static method to validate password and generate token
userSchema.static('matchPasswordAndGenerateToken', async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error('User not found!');

  const salt = user.salt;
  const hashedPassword = user.password;

  const userProvidedHash = createHmac('sha256', salt)
    .update(password)
    .digest('hex');
  if (hashedPassword !== userProvidedHash) throw new Error('Incorrect password');
  
  const token = createTokenForUser(user);
  return token;
});

// Pre-save hook to hash password before saving to DB
userSchema.pre('save', function (next) {
  const user = this;

  // Only hash the password if it's modified
  if (!user.isModified("password")) return next();

  const salt = randomBytes(16).toString('hex');
  const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

  user.salt = salt;
  user.password = hashedPassword;

  next();
});

userSchema.methods.changePassword = async function (newPassword) {
    // Ensure we call the pre-save hook to hash the password
    this.password = newPassword;
    await this.save();  // Trigger pre-save hook that hashes the password
  };
  

const User = model('user', userSchema);

module.exports = User;
