const Design = require('../../models/design');
const Community = require('../../models/community');
const { transformDesign } = require('./merge');

module.exports = {
  reach: async(args,req)=>{
    if (!req.isAuth) {
      throw new Error('Unauthenticated!');
    }
    
   
  }
};
