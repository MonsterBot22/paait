const { Schema, model } = require("mongoose");

const schema = Schema({
  userID: { type: String, default: "" },
  codes: { type: Array, default: [] },
  getLikeCount: { type: Number, default: 0 }
  biography: {type: String, default: null},
website: {type: String, default: null},
github: {type: String, default: null},
twitter: {type: String, default: null},
instagram: {type: String, default: null}
});

module.exports = model("user", schema);