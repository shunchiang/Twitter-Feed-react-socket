const Twitter = require("twitter");
require("dotenv").config({ path: "../../.env" });

module.exports = (app, io) => {
  let twitter = new Twitter({
    consumer_key: "ZRCoumSo8cjRRwvD5tutfWdBU",
    consumer_secret: "pv2wh5UpT9gPXuZaWkHIsFLOOyqayrBYyn3rL0iiEBOWnuGyvs",
    access_token_key: "1251960258-zhaJpqGprw8eUkZJCLRrQwSpFaFX1uZCDxJqq5J",
    access_token_secret: "P97Gkum3Qj0228ozm5ShWUwbu2JS24cqYkDq6iChwDs3R"
  });

  let socketConnection;
  let twitterStream;

  app.locals.searchTerm = "COVID19"; //Default search term for twitter stream.
  app.locals.showRetweets = false; //Default

  /**
   * Resumes twitter stream.
   */
  const stream = () => {
    console.log("Resuming " + app.locals.searchTerm);
    twitter.stream(
      "statuses/filter",
      { track: app.locals.searchTerm },
      stream => {
        stream.on("data", tweet => {
          sendMessage(tweet);
        });

        stream.on("error", error => {
          console.log(error);
        });

        twitterStream = stream;
      }
    );
  };

  /**
   * Sets search term for twitter stream.
   */
  app.post("/setSearchTerm", (req, res) => {
    let term = req.body.term;
    app.locals.searchTerm = term;
    twitterStream.destroy();
    stream();
  });

  /**
   * Pauses the twitter stream.
   */
  app.post("/pause", (req, res) => {
    console.log("Pause");
    twitterStream.destroy();
  });

  /**
   * Resumes the twitter stream.
   */
  app.post("/resume", (req, res) => {
    console.log("Resume");
    stream();
  });

  //Establishes socket connection.
  io.on("connection", socket => {
    socketConnection = socket;
    stream();
    socket.on("connection", () => console.log("Client connected"));
    socket.on("disconnect", () => console.log("Client disconnected"));
  });

  /**
   * Emits data from stream.
   * @param {String} msg
   */
  const sendMessage = msg => {
    if (msg.text.includes("RT")) {
      return;
    }
    socketConnection.emit("tweets", msg);
  };
};
