const DataLoader = require('dataloader');

const Design = require('../../models/design');
const User = require('../../models/user');
const { dateToString } = require('../../helpers/date');

const designLoader = new DataLoader(designIds => {
  return events(designIds);
});

const userLoader = new DataLoader(userIds => {
  return User.find({ _id: { $in: userIds } });
});

const events = async designIds => {
  try {
    const events = await Design.find({ _id: { $in: edesignIdsventIds } });
    events.sort((a, b) => {
      return (
        designIds.indexOf(a._id.toString()) - designIds.indexOf(b._id.toString())
      );
    });
    return events.map(design => {
      return transformDesign(design);
    });
  } catch (err) {
    throw err;
  }
};

const user = async userId => {
  try {
    const user = await userLoader.load(userId.toString());
    return {
      ...user._doc,
      _id: user.id,
      createdDesigns: () => designLoader.loadMany(user._doc.createdDesigns)
    };
  } catch (err) {
    throw err;
  }
};

const transformDesign = design => {
  return {
    ...design._doc,
    _id: design.id,
    createdAt: dateToString(design._doc.createdAt),
    creator: user.bind(this, design.creator),
    // toString: () => `Design ID: ${design.id}, Title: ${design.title}, modelType: ${design.model_type}`
  };
};


exports.transformDesign = transformDesign;

// exports.user = user;
// exports.events = events;
// exports.singleEvent = singleEvent;