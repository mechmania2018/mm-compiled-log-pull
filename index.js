const { promisify } = require("util");

const mongoose = require("mongoose");
const AWS = require("aws-sdk");
const authenticate = require("mm-authenticate")(mongoose);
const { send, buffer } = require("micro");
const { Script } = require('mm-schemas')(mongoose)

mongoose.connect(process.env.MONGO_URL);
mongoose.Promise = global.Promise;

const s3 = new AWS.S3({
  params: { Bucket: "mechmania" }
});

const getObject = promisify(s3.getObject.bind(s3));

module.exports = authenticate(async (req, res) => {
  const team = req.user;
  console.log(`${team.name} - Getting the compiled log file from S3`);
  if(!team.latestScript) {
    send(res, 404, "You haven't uploaded any bots yet using `mm push`");
  }
  const script = await Script.findById(team.latestScript).exec()
  
  console.log("script " + script.key)
  const data = s3
    .getObject({ Key: `compiled/${script.key}` })
    .createReadStream()
    .on("error", error => {
      console.log(error);
      send(res, 202, "Not Ready Yet");
    });
    console.log("script " + script.key)

  send(res, 200, data);
});
