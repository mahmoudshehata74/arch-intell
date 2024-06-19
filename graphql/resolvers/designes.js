const Design = require('../../models/design');
const User = require('../../models/user');
const { AuthenticationError, UserInputError } = require('apollo-server');
const { transformDesign } = require('./merge');
const checkAuth = require('../../middleware/is-auth');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { InferenceSession } = require('onnxjs');
const { throws } = require('assert');
const { exec } = require('child_process');
const { spawn } = require('child_process');
const { dateToString } = require('../../helpers/date');


// const transformDesign = design => {
//   return {
//     _id: design._id.toString(),
//     title: design.title,
//     description: design.description,
//     model_type: design.model_type,
//     outputUrl2D: design.outputUrl2D,
//     outputUrl3D: design.outputUrl3D,
//     createdAt: dateToString(design.createdAt),
//     creator: design.creator ? {
//       _id: design.creator._id.toString(),
//       createdDesigns: design.creator.createdDesigns?.map(d => ({
//         _id: d._id.toString(),
//         title: d.title,
//         description: d.description,
//         model_type: d.model_type
//       })) || []
//     } : {
//       _id: '',
//       createdDesigns: []
//     }
//   };
// };


// Load the ONNX model
// const session = new InferenceSession();
// await session.loadModel('../../models/txt2imgGenerator.onnx');



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

  createDesign: async (args, req) => {
    const { designInput } = args;
    const description = designInput.description;
    const modelType = designInput.model_type;

    try {
      const response = await axios.post('https://3913-34-87-69-124.ngrok-free.app/generateDesign', {
        model_type: modelType,
        prompt: description,
      });

      const outputFromFlaskServer = response.data.image;

      const design = new Design({
        title: designInput.title,
        description: designInput.description,
        creator: req.userId,
        createdAt: new Date().toISOString(),
        model_type: designInput.model_type,
        outputUrl2D: modelType === "2D" ? outputFromFlaskServer : null,
        outputUrl3D: modelType === "3D" ? outputFromFlaskServer : null,
      });

      const results = await design.save();
      console.log(`Design created by: ${req.username}`);

      const createdDesigns = transformDesign(results);
      const creator = await User.findById(req.userId);

      if (!creator) {
        throw new Error('User not found.');
      }
      creator.createdDesigns.push(transformUser(results));
      creator.username = req.username;
      await creator.save();

      return createdDesigns;

    } catch (err) {
      console.error(err);
      throw new Error('Error creating design');
    }
  }

  ,
  editDesign: async ({ req, description }) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }

    try {
      const lastInsertedDesign = await Design.findOne().sort({ createdAt: -1 });
      if (!lastInsertedDesign) {
        throw new Error('No design found.');
      }

      const path2D = lastInsertedDesign.outputUrl2D;
      const path3D = lastInsertedDesign.outputUrl3D;
      const modelType = lastInsertedDesign.model_type;
      const title = lastInsertedDesign.title;

      let response;
      let outputFromFlaskServer;

      if (path2D == null && path3D != null) {
        response = await axios.post('https://9900-34-87-57-59.ngrok-free.app/editDesign', {
          prompt: description,
          path: path3D,
        });
        outputFromFlaskServer = response.data.image;
        lastInsertedDesign.outputUrl3D = outputFromFlaskServer;
      } else if (path3D == null && path2D != null) {
        response = await axios.post('https://9900-34-87-57-59.ngrok-free.app/editDesign', {
          prompt: description,
          path: path2D,
        });
        outputFromFlaskServer = response.data.image;
        lastInsertedDesign.outputUrl2D = outputFromFlaskServer;
      } else {
        throw new Error('Both 2D and 3D paths are null or both are not null.');
      }

      lastInsertedDesign.description = description;
      await lastInsertedDesign.save();
      console.log("Design edited");

      const createdDesigns = transformDesign(lastInsertedDesign);
      return createdDesigns;

    } catch (err) {
      console.error(err);
      throw new Error('Error editing design');
    }
  }
,
  deleteDesign: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const { designId } = args;
    try {
      const design = await Design.findById(designId);
      if (!design) {
        throw new Error("Design not found!");
      }
      const deletedDesign = await Design.findByIdAndDelete(designId);
      if (!deletedDesign) {
        throw new Error("Design not found or already deleted!");
      }
      await deletedDesign.save();
      return transformDesign(deletedDesign);
    } catch (err) {
      throw err;
    }
  },
  likeDesign: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const { designId } = args;
    try {
      const design = await Design.findById(designId);
      design.likes.push({ username: req.username, createdAt: new Date().toISOString() });
      await design.save();
      return transformDesign(design);
    } catch (err) {
      throw err;
    }
  },
  unLikeDesign: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const { designId } = args;
    try {
      const design = await Design.findById(designId);
      design.likes = design.likes.filter((like) => like.username !== req.username);
      await design.save();
      return transformDesign(design);
    } catch (err) {
      throw err;
    }
  },
  addComment: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const { designId, comment } = args;
    try {
      const design = await Design.findById(designId);
      design.comments.push({ comment, username: req.username, createdAt: new Date().toISOString() });
      await design.save();
      return transformDesign(design);
    } catch (err) {
      throw err;
    }
  },
  deleteComment: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const { designId, commentId } = args;
    try {
      const design = await Design.findById(designId);
      design.comments = design.comments.filter((comment) => comment._id.toString() !== commentId);
      await design.save();
      return transformDesign(design);
    } catch (err) {
      throw err;
    }
  },
  designs: async (req) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    try {
      const designs = await Design.find();
      return designs;
    } catch (error) {
      throw new Error('Failed to fetch designs');
    }
  },

  searchDesignTitle: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const { title } = args;


    try {
      const designs = await Design.find({ title });
      if (!designs) {
        throw new Error('Design not found');
      }
      return designs;
    } catch (err) {
      throw err;
    }
  },

  searchDesignId: async (args, req) => {
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    const { designId } = args;
    try {
      const design = await Design.findById(designId);
      if (!design) {
        throw new Error('Design not found');
      }
      return transformDesign(design);
    } catch (err) {
      throw err;
    }
  },

  createdDesigns: async ({ userId, req }) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }

    try {
      const user = await User.findById(userId).populate('createdDesigns');
      if (!user) {
        throw new Error('User not found');
      }

      const designs = user.createdDesigns.map(transformDesign);
      return designs;
    } catch (error) {
      throw new Error(error);
    }
  },

};


