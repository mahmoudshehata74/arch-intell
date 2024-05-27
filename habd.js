const { exec } = require('child_process');

// Function to execute the Python script
function runPythonScript(parameter) {
  return new Promise((resolve, reject) => {
    // Execute the Python script
    const command = `python api.py ${parameter}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Usage example
const inputParameter = "exampleInput";
runPythonScript(inputParameter)
  .then(output => {
    console.log(output);
  })
  .catch(error => {
    console.error(error);
  });
















// module.exports = {
//   createPost: async (_, { body }, context) => {
//     const user = checkAuth(context);

//     if (body.trim() === '') {
//       throw new Error('Post body must not be empty');
//     }

//     const newPost = new Post({
//       body,
//       user: user.id,
//       username: user.username,
//       createdAt: new Date().toISOString()
//     });

//     const post = await newPost.save();

//     context.pubsub.publish('NEW_POST', {
//       newPost: post
//     });

//     return post;
//   },
//   createDesign: async (args, req) => {
//     if (!req.isAuth) {
//       throw new Error('Unauthenticated!');
//     }
//     const design = new Design({
//       title: args.designInput.title,
//       description: args.designInput.description,
//       // date: new Date(args.designInput.date),
//       creator: req.userId,
//       createdAt: new Date().toISOString(),
//     });
//     let createdDesigns;
//     try {
//       const result = await design.save();
//       console.log("design created");

//       createdDesigns = transformEvent(result);
//       const creator = await User.findById(req.userId);

//       if (!creator) {
//         throw new Error('User not found.');
//       }
//       creator.createdDesigns.push(design);
//       await creator.save();

//       return createdDesigns;
//     } catch (err) {
//       console.log(err);
//       throw err;
//     }
//   }, designs: async () => {
//     try {
//       const designs = await Design.find();
//       return designs;
//     } catch (error) {
//       throw new Error('Failed to fetch designs');
//     }
//   },
//   searchDesign: async ({ title, req }) => {
//     // if (!req.isAuth) {
//     //   throw new Error('Unauthenticated!');
//     // }
//     try {
//       const design = await Design.findOne({ title });
//       return design;
//     } catch (error) {
//       throw new Error('Failed to fetch design');
//     }
//   },
//   deleteDesign: async (_, { designId }, context) => {
//     const user = checkAuth(context);

//     try {
//       const design = await Design.findById(designId);
//       if (user.name === design.username) {
//         await design.delete();
//         return 'Post deleted successfully';
//       } else {
//         throw new AuthenticationError('Action not allowed');
//       }
//     } catch (err) {
//       throw new Error(err);
//     }
//   },

//   likeDesign: async (_, { designId }, context) => {
//     const { username } = checkAuth(context);

//     const design = await Design.findById(designId);
//     if (design) {
//       if (design.likes.find((like) => like.username === username)) {
//         // Post already likes, unlike it
//         design.likes = design.likes.filter((like) => like.username !== username);
//       } else {
//         // Not liked, like post
//         design.likes.push({
//           username,
//           createdAt: new Date().toISOString()
//         });
//       }

//       await design.save();
//       return design;
//     } else throw new UserInputError('Post not found');

//   },
//   // unLikeDesign: async ({ designId , req}) => {
//   //   if (!req.isAuth) {
//   //     throw new Error('Unauthenticated!');
//   //   }
//   //   try {
//   //     const design = await Design.findById(designId);
//   //     // Implement the logic to handle the unlike operation on the design
//   //     design.reach.likes -= 1;
//   //     design.save();
//   //     return design;
//   //   } catch (error) {
//   //     throw new Error('Failed to unlike design');
//   //   }
//   // },
//   addComment: async (_, { designId, comment }, context) => {
//     const { username } = checkAuth(context);
//     try {
//       const design = await Design.findById(designId);

//       if (comment.trim() === '') {
//         throw new UserInputError('Empty comment', {
//           errors: {
//             body: 'Comment body must not empty'
//           }
//         });
//       }
//       // Implement the logic to add the comment to the design
//       if (design) {
//         design.comments.unshift({
//           comment,
//           username,
//           createdAt: new Date().toISOString()
//         });
//         await design.save();
//         console.log("comment added");
//         return design;
//       } else throw new UserInputError('design not found');
//     } catch (error) {
//       throw new Error('Failed to add comment \n' + error);
//     }
//   },
//   deleteComment: async (_, { designId, commentId }, context) => {
//     const { username } = checkAuth(context);
//     const design = await Design.findById(designId);
//     if (design) {
//       const commentIndex = design.comments.findIndex((c) => c.id === commentId);

//       if (design.comments[commentIndex].username === username) {
//         design.comments.splice(commentIndex, 1);
//         await design.save();
//         return design;
//       } else {
//         throw new AuthenticationError('Action not allowed');
//       }
//     } else {
//       throw new UserInputError('Post not found');
//     }

//   },

//   followers: async (req) => {
//     if (!req.isAuth) {
//       throw new Error('Unauthenticated!');
//     }
//     try {
//       users.id.followers.push
//       const users = await User.id.followers.find();
//       return users;
//     } catch (error) {
//       throw new Error('Failed to fetch followers');
//     }
//   },
//   followings: async (req) => {
//     if (!req.isAuth) {
//       throw new Error('Unauthenticated!');
//     }
//     try {
//       const users = await User.id.followings.find();
//       return users;
//     } catch (error) {
//       throw new Error('Failed to fetch followings');
//     }
//   },
//   followUser: async ({ req }) => {
//     if (!req.isAuth) {
//       throw new Error('Unauthenticated!');
//     }
//     try {
//       const user = await User.findById(req.userId);
//       // Implement the logic to handle the follow operation on the user
//       if (!user.followers.includes(req.userId)) {
//         user.followers.push(req.userId);
//         user.save();
//         return user;
//       }
//     } catch (error) {
//       throw new Error('Failed to follow user');
//     }
//   },
//   unFollowUser: async ({ userId, req }) => {
//     if (!req.isAuth) {
//       throw new Error('Unauthenticated!');
//     }
//     try {
//       const user = await User.findById(userId);
//       // Implement the logic to handle the unfollow operation on the user
//       if (user.followers.includes(userId)) {
//         user.followers.pull(userId);
//         user.save();
//         return user;
//       }
//     } catch (error) {
//       throw new Error('Failed to unfollow user');
//     }

//   }
// };