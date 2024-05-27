const Design = require('../../models/design');
const User = require('../../models/user');
const { AuthenticationError, UserInputError } = require('apollo-server');
const { transformDesign } = require('./merge');
const checkAuth = require('../../middleware/is-auth');
const fs = require('fs');
const path = require('path');

const { InferenceSession } = require('onnxjs');
const { throws } = require('assert');
const { exec } = require('child_process');
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
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }

    const { designInput } = args;

    let description = designInput.description
    let modelType = designInput.model_type
    // Function to execute the Python script
    function runPythonScript(description) {
      return new Promise((resolve, reject) => {
        // Execute the Python script
        const command = `python generatorsModels/txtTOimg.py ${description} ${modelType}`;
        exec(command, (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(stdout);
          }
        });
      });
    }
    async function main() {
      try {
        const output = await runPythonScript(description,modelType);
        // console.log(description); 
        console.log("runPy \n"+output);
        return output;
      } catch (error) {
        console.error(error);
      }
    }

    const model_type = designInput.model_type.toString().trim();
    // console.log(model_type);
    // const l = model_type.length;
    // console.log(l);

    const result = await main();
    const trimmedOutput = result.trim();

    const design = new Design({
      title: designInput.title,
      description: designInput.description,
      creator: req.userId,
      createdAt: new Date().toISOString(),
      model_type: designInput.model_type,
      outputUrl2D: model_type === "2D" ? trimmedOutput : null,
      outputUrl3D: model_type === "3D" ? trimmedOutput : null,
    });

    let createdDesigns;
    try {
      const results = await design.save();
      console.log(`Design created by : ${req.username}`);
      // console.log("design created");

      createdDesigns = transformDesign(results);
      const creator = await User.findById(req.userId);

      if (!creator) {
        throw new Error('User not found.');
      }
      creator.createdDesigns.push(transformUser(results));
      creator.username = req.username;
      await creator.save();
      // console.log(`Designs created : ${createdDesigns}`);
  
      return createdDesigns;

    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  editDesign: async ({ req , description }) => {
    // if (!req.isAuth) {
    //   throw new Error('Unauthenticated!');
    // }
    
    const lastInsertedDesign = await Design.findOne().sort({ createdAt: -1 });
    const path2D = lastInsertedDesign.outputUrl3D;
    const path3D = lastInsertedDesign.outputUrl2D;
    if (path2D == null){
      const title = lastInsertedDesign.title;
      const desc = lastInsertedDesign.description;

      // const path = " 2D imge path"

      function runPythonScript3D(description, path2D) {
        return new Promise((resolve, reject) => {
          const command = `python generatorsModels/imgTOimg.py "${description}" "${path2D}"`; 
          exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });
      }
      async function main3D() {
        try {
          const output = await runPythonScript3D(description, path2D);
          console.log(description);
          console.log(path2D);
          console.log(output);
          return output;
        } catch (error) {
          console.error(error);
        }
      }


      const result3D = await main3D();
      const trimmedOutput3D = result3D.trim();

      const design = new Design({
        title: title,
        description: desc,
        outputUrl2D: path2D,
        outputUrl3D:  trimmedOutput3D,
      });

      const result = await design.save();
        console.log("design edited");

        createdDesigns = transformDesign(result);
        return createdDesigns;


}
    if (path3D == null){
      const title = lastInsertedDesign.title;
      const desc = lastInsertedDesign.description;

      // const path = " 2D imge path"

      function runPythonScript3D(description, path3D) {
        return new Promise((resolve, reject) => {
          const command = `python generatorsModels/imgTOimg.py "${description}" "${path3D}"`; 
          exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(error);
            } else {
              resolve(stdout);
            }
          });
        });
      }
      async function main3D() {
        try {
          const output = await runPythonScript3D(description, path3D);
          console.log(description);
          console.log(path3D);
          console.log(output);
          return output;
        } catch (error) {
          console.error(error);
        }
      }


      const result3D = await main3D();
      const trimmedOutput3D = result3D.trim();

      const design = new Design({
        title: title,
        description: desc,
        outputUrl2D: path3D,
        outputUrl3D:  trimmedOutput3D,
      });

      const result = await design.save();
        console.log("design edited");

        createdDesigns = transformDesign(result);
        return createdDesigns;
}

    // let createdDesigns;
    // try {
    //   const result = await design.save();
    //   console.log("design edited");

    //   createdDesigns = transformDesign(result);
    //   const creator = await User.findById(req.userId);

    //   if (!creator) {
    //     throw new Error('User not found.');
    //   }
    //   creator.createdDesigns.push(design);
    //   creator.username = req.username;
    //   await creator.save();
    //   return createdDesigns;
    // } catch (err) {
    //   console.log(err);
    //   throw err;
    // }

  },
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
      const designs = await Design.find({title});
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


