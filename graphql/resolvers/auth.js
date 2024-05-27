const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../../models/user');
const { AuthenticationError, UserInputError } = require('apollo-server');
const Design = require('../../models/design');
const checkAuth = require('../../middleware/is-auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { transformDesign } = require('./merge');


validateLoginInput = (email, password) => {
  const errors = {};
  if (email.trim() === '') {
    errors.email = 'email must not be empty';
  }
  if (password.trim() === '') {
    errors.password = 'Password must not be empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1
  };
};

validateRegisterInput = (
  username,
  email,
  password,
) => {
  const errors = {};
  if (username.trim() === '') {
    errors.username = 'Username must not be empty';
  }
  if (email.trim() === '') {
    errors.email = 'Email must not be empty';
  } else {
    const regEx = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
    if (!email.match(regEx)) {
      errors.email = 'Email must be a valid email address';
    }
  }
  if (password === '') {
    errors.password = 'Password must not empty';
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1
  };
};


// const transformDesign = (design) => {
//   return {
//     ...design._doc,
//     _id: design.id,
//     createdAt: design._doc.createdAt.toISOString(),
//     creator: getUser.bind(this, design.creator),
//   };
// };

const transformUser = (user) => {
  return {
    ...user._doc,
    _id: user.id,
    createdDesigns: getDesigns.bind(this, user._doc.createdDesigns),
    followers: getUsers.bind(this, user._doc.followers),
    following: getUsers.bind(this, user._doc.following),
  };
};

const getUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    return transformUser(user);
  } catch (err) {
    throw err;
  }
};

const getDesigns = async (designIds) => {
  try {
    const designs = await Design.find({ _id: { $in: designIds } });
    return designs.map((design) => {
      return transformDesign(design);
    });
  } catch (err) {
    throw err;
  }
};

const getUsers = async (userIds) => {
  try {
    const users = await User.find({ _id: { $in: userIds } });
    return users.map((user) => {
      return transformUser(user);
    });
  } catch (err) {
    throw err;
  }
};





module.exports = {
  createUser: async args => {
    const { username, email, password } = args.userInput;
    const { valid, errors } = validateRegisterInput(
      username,
      email,
      password,
    );
    if (!valid) {
      throw new UserInputError('Errors', { errors });
    }

    try {
      const existingUser = await User.findOne({ email: args.userInput.email });
      if (existingUser) {
        throw new Error('User exists already.');
      }
      const hashedPassword = await bcrypt.hash(args.userInput.password, 12);

      const user = new User({
        username: args.userInput.username,
        email: args.userInput.email,
        password: hashedPassword
      });

      const result = await user.save();

      return { ...result._doc, password: null, _id: result.id };
    } catch (err) {
      throw err;
    }
  },
  // Resolver function for login
  login: async ({ email, password }) => {
    const { errors, valid } = validateLoginInput(email, password);

    if (!valid) {
      throw new UserInputError('Errors', { errors });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      throw new Error('User does not exist!');
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error('Password is incorrect!');
    }

    const SECRET_KEY = process.env.SECRET_KEY; // Replace with your Pixlr API secret

    const signToken = (payload) => {
      const token = jwt.sign(payload, SECRET_KEY) //{ ,algorithm: 'RS256' }); // Replace with your desired algorithm
      return token;
    };

    const payload = {
      username: user.username,
      userId: user.id,
      email: user.email,
    };

    const token = signToken(payload);

    return {
      username: user.username,
      userId: user.id,
      token: token,
      tokenExpiration: 1,
    };
  },

  // login: async ({ email, password }) => {
  //   const { errors, valid } = validateLoginInput(email, password);

  //   if (!valid) {
  //     throw new UserInputError('Errors', { errors });
  //   }
  //   const user = await User.findOne({ email: email });
  //   if (!user) {
  //     throw new Error('User does not exist!');
  //   }
  //   const isEqual = await bcrypt.compare(password, user.password);
  //   if (!isEqual) {
  //     throw new Error('Password is incorrect!');
  //   }
  //   const token = jwt.sign(
  //     { username: user.username, userId: user.id, email: user.email },
  //     process.env.SECRET_KEY,
  //     {
  //       expiresIn: '1h'
  //     }
  //   );
  //   return { username: user.username, userId: user.id, token: token, tokenExpiration: 1 };
  // },

  uploadProfilePhoto: async ({ req,userId, photo }) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }

    try {
      // Assuming you have a database connection and a User model
      const user = await User.findById(userId).populate('image');

      // const user = await User.findById(req.id);

      if (!user) {
        throw new Error('user not found');
      }

      // return `http://localhost:9595/${user.image}`;
      user.image = "http://localhost:9595/uploads/"+photo;
      // const image = user.image.map(transformUser);


      await user.save();

      return transformUser(user);
    } catch (error) {
      console.error('Error updating user profile picture:', error);
      throw error;
    }
  },




  // async (id, photo) => {

  //   if (!req.isAuth) {
  //     throw new Error('Unauthenticated!');
  //   }

  //   const profile = await User.findById(id);
  //   if (!profile) {
  //     throw new Error('Profile not found');
  //   }

  //   // Upload the photo using Multer
  //   // Assuming the 'photo' field is sent in the request as a File object
  //   const uploadedPhoto = await upload.single('photo')(photo);

  //   // Update the profile with the photo filename
  //   profile.image = uploadedPhoto.filename;
  //   await profile.save();

  //   return profile;
  // },
  users: async (req) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    try {
      const users = await User.find();
      return users;
    } catch (error) {
      throw new Error('Failed to fetch users');
    }
  },
  searchUser: async ({ userName, req }) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    try {
      const user = await User.findOne({ username: userName });
      // const design = await Design.findById( "65d15c03a0ce078bfac76081" );
      // designData = transformDesign(design)
      const result = { user };

      return user;
    } catch (error) {
      throw new Error(error);

    }
  },
  followUser: async (args, req) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    const { userId } = args;
    try {
      const userToFollow = await User.findById(userId);
      const currentUser = await User.findById(req.userId);

      if (!userToFollow || !currentUser) {
        throw new Error('User not found');
      }

      if (currentUser.followings.includes(userToFollow._id)) {
        throw new Error('You are already following this user');
      }

      userToFollow.followers.push(currentUser._id);

      await Promise.all([currentUser.save(), userToFollow.save()]);

      console.log("followed successfully");
      return transformUser(userToFollow);
    } catch (err) {
      throw err;
    }
  },
  unFollowUser: async (args, req) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    const { userId } = args;
    try {
      const userToUnFollow = await User.findById(userId);
      const currentUser = await User.findById(req.userId);

      if (!userToUnFollow || !currentUser) {
        throw new Error('User not found');
      }

      if (!currentUser.followings.includes(userToUnFollow._id)) {
        throw new Error('You are already not following this user');
      }

      currentUser.followings.pull(userToUnFollow._id);

      await Promise.all([currentUser.save(), userToUnFollow.save()]);

      console.log("followed successfully");
      return transformUser(userToUnFollow);
    } catch (err) {
      throw err;
    }
  },
  followers: async (args, req) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    const { userID } = args;
    try {
      const user = await User.findById(userID).populate('followers');
      if (!user) {
        throw new Error('User not found');
      }
      return user.followers.map((follower) => transformUser(follower));
    } catch (err) {
      throw err;
    }
  },
  followings: async (args, req) => {

    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    const { userID } = args;
    try {
      const user = await User.findById(userID).populate('followings');
      if (!user) {
        throw new Error('User not found');
      }
      return user.followings.map((following) => transformUser(following));
    } catch (err) {
      throw err;
    }
  },


};