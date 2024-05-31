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
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }

    const { designInput } = args;
    const description = designInput.description;
    const modelType = designInput.model_type;

    // Function to execute the Python script
    // function runPythonScript(modelType, description) {
    //   return new Promise((resolve, reject) => {
    //     // Escape the arguments to avoid injection issues and handle spaces correctly
    //     const command = `python generatorsModels/txtTOimg.py "${modelType}" "${description.replace(/"/g, '\\"')}"`;
    //     const options = { maxBuffer: 1024 * 1024 * 5 }; // 5MB buffer
    //     exec(command, options, (error, stdout, stderr) => {
    //       if (error) {
    //         reject(error);
    //       } else {
    //         if (stderr) {
    //           console.error(`stderr: ${stderr}`);
    //         }
    //         resolve(stdout);
    //       }
    //     });
    //   });
    // }

    // async function main() {
    //   try {
    //     const output = await runPythonScript(modelType, description);
    //     console.log("runPy output:\n", output);
    //     return output;
    //   } catch (error) {
    //     console.error(error);
    //     return null;
    //   }
    // }

    // const result = await main();
    // if (!result) {
    //   throw new Error('No output from Python script');
    // }
    // const trimmedOutput = result.trim();

    const response = await axios.post('http://localhost:5000/generateDesign', {
        model_type: modelType,
        prompt: description,
      });

      // Get the generated 3D output URL from the Flask server response
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

    try {
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
      console.log(err);
      throw err;
    }
  }

  ,
  editDesign: async ({ req, description }) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    
    // const lastInsertedDesign = await User.findById(req.userId, 'createdDesigns')
        // .sort({ createdAt: -1 })
        // .limit(1)
        // .populate('createdDesigns');

    const lastInsertedDesign = await Design.findOne().sort({ createdAt: -1 });
    const path2D = lastInsertedDesign.outputUrl2D;
    const path3D = lastInsertedDesign.outputUrl3D;
    const modelTupe = lastInsertedDesign.model_type;
    


    if (path2D == null) {
      const title = lastInsertedDesign.title;
      const desc = lastInsertedDesign.description;
      


      // const path = " 2D imge path"
      console.log("The length of the encoded_image is:", path3D.length);


      const response = await axios.post('http://localhost:5000/editDesign', {
        prompt: description,
        path: path3D,
      });

      // Get the generated 3D output URL from the Flask server response
      const outputFromFlaskServer = response.data.image;


      const design = new Design({
        title: title,
        description: description,
        outputUrl2D: path2D,
        outputUrl3D: outputFromFlaskServer,
        model_type: modelTupe
      });

      const result = await design.save();
      console.log("design edited");

      createdDesigns = transformDesign(result);
      return createdDesigns;


    }
    if (path3D == null) {
      const title = lastInsertedDesign.title;
      const desc = lastInsertedDesign.description;


      // const path = " 2D imge path"
      console.log("The length of the encoded_image is:", path2D.length);

      const response = await axios.post('http://localhost:5000/editDesign', {
        prompt: description,
        path: path2D,
      });
      // Get the generated 3D output URL from the Flask server response
      const outputFromFlaskServer = response.data.image;


      const design = new Design({
        title: title,
        description: description,
        outputUrl2D: outputFromFlaskServer,
        outputUrl3D: path3D,
        model_type: modelTupe
      });

      const result = await design.save();
      console.log("design edited");

      createdDesigns = transformDesign(result);
      return createdDesigns;
    }

  },



  // editDesign : async ({ req, userId, description }) => {
  //   // Uncomment the following lines if authentication is needed
  //   // if (!req.isAuth) {
  //   //   throw new Error('Unauthenticated!');
  //   // }

  //   try {
  //     // Find the user by ID and populate their createdDesigns
  //     const user = await User.findById(userId).populate({
  //       path: 'createdDesigns',
  //       options: {
  //         sort: { createdAt: -1 }, // Sort by creation date in descending order
  //         limit: 1, // We only need the most recent design
  //       }
  //     });

  //     if (!user) {
  //       throw new Error('User not found');
  //     }

  //     if (user.createdDesigns.length === 0) {
  //       throw new Error('No designs found for this user');
  //     }

  //     // Get the most recent design
  //     const lastInsertedDesign = user.createdDesigns[0];
  //     let path2D = lastInsertedDesign.outputUrl3D;
  //     let path3D = lastInsertedDesign.outputUrl2D;

  //     const title = lastInsertedDesign.title;
  //     const desc = lastInsertedDesign.description;

  //     // Helper function to run a Python script
  //     function runPythonScript(description, outputPath) {
  //       return new Promise((resolve, reject) => {
  //         const command = `python generatorsModels/imgTOimg.py "${description}" "${outputPath}"`;
  //         const options = { maxBuffer: 1024 * 1024 * 5 }; // 5MB buffer

  //         exec(command, options, (error, stdout, stderr) => {
  //           if (error) {
  //             reject(error);
  //           } else {
  //             resolve(stdout);
  //           }
  //         });
  //       });
  //     }

  //     // If path2D is null, generate it using the Python script
  //     if (!path2D) {
  //       const result2D = await runPythonScript(description, path2D);
  //       if (!result2D) {
  //         throw new Error('No output from Python script for 2D');
  //       }
  //       path2D = result2D.trim();
  //     }

  //     // If path3D is null, generate it using the Python script
  //     if (!path3D) {
  //       const result3D = await runPythonScript(description, path3D);
  //       if (!result3D) {
  //         throw new Error('No output from Python script for 3D');
  //       }
  //       path3D = result3D.trim();
  //     }

  //     // Update the design
  //     lastInsertedDesign.outputUrl2D = path2D;
  //     lastInsertedDesign.outputUrl3D = path3D;
  //     lastInsertedDesign.description = description;

  //     const result = await lastInsertedDesign.save();
  //     console.log("Design edited");

  //     const transformedDesign = transformDesign(result);
  //     return transformedDesign;

  //   } catch (error) {
  //     throw new Error(error.message);
  //   }
  // },
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


