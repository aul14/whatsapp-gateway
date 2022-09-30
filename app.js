const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const express = require("express");
const { body, validationResult } = require("express-validator");
const fileUpload = require("express-fileupload");
const qrcode = require("qrcode");
const socketIO = require("socket.io");
const http = require("http");
const fs = require("fs");
const axios = require("axios");
const { phoneNumberFormatter } = require("./helpers/formatter");
const { response } = require("express");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  fileUpload({
    debug: true,
  })
);

const SESSION_FILE_PATH = "./whatsapp-session.json";

let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname });
});
const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process", // <- this one doesn't works in Windows
      "--disable-gpu",
    ],
  },
  authStrategy: new LocalAuth(),
});

client.on("message", (msg) => {
  if (msg.body == "!ping") {
    msg.reply("pong");
  } else if (msg.body == "!kuy") {
    msg.reply("ayo ke hotel");
  }
});

client.initialize();

// SOCKET IO
io.on("connection", function (socket) {
  socket.emit("message", "Connecting...");

  client.on("qr", (qr) => {
    // Generate and scan this code with your phone
    console.log("QR RECEIVED", qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit("qr", url);
      socket.emit("message", "QR code received, scan please!");
    });
  });

  client.on("ready", () => {
    socket.emit("ready", "Whatsapp is ready!");
    socket.emit("message", "Whatsapp is ready!");
  });

  client.on("authenticated", () => {
    socket.emit("authenticated", "Whatsapp is authenticated!");
    socket.emit("message", "Whatsapp is authenticated!");
    console.log("AUTHENTICATED");
  });

  client.on("auth_failure", function (session) {
    socket.emit("message", "Auth failure, restarting...");
  });

  client.on("disconnected", (reason) => {
    socket.emit("message", "Whatsapp is disconnected!");
    client.destroy();
    client.initialize();
  });
});

// FUNGSI UNTUK MENGECEK NUMBER SUDAH TERDAFTAR DI WHATSAPP
const checkRegisteredNumber = async function (number) {
  const isRegistered = await client.isRegisteredUser(number);
  return isRegistered;
};
// SEND MESSAGE
app.post(
  "/send-message",
  [body("number").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req).formatWith(({ msg }) => {
      return msg;
    });

    if (!errors.isEmpty()) {
      return res.status(500).json({
        status: false,
        message: errors.mapped(),
      });
    }
    const number = phoneNumberFormatter(req.body.number);
    const message = req.body.message;

    const isRegisteredNumber = await checkRegisteredNumber(number);

    if (!isRegisteredNumber) {
      return res.status(500).json({
        status: false,
        message: "The number is not registered!",
      });
    }

    client
      .sendMessage(number, message)
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);

// SEND MEDIA
app.post(
  "/send-media",
  [body("number").notEmpty(), body("message").notEmpty()],
  async (req, res) => {
    const number = phoneNumberFormatter(req.body.number);
    const caption = req.body.caption;
    const fileUrl = req.body.file;

    // const media = MessageMedia.fromFilePath("./image-example.png");

    // INI CONTOH UNTUK MENGIRIM FILE DARI LOCAL STORAGE
    // const file = req.files.file;
    // const media = new MessageMedia(
    //   file.mimetype,
    //   file.data.toString("base64"),
    //   file.name
    // );

    // INI CONTOH KIRIM FILE DARI URL
    let mimetype;
    const attachment = await axios
      .get(fileUrl, {
        responseType: "arraybuffer",
      })
      .then((response) => {
        mimetype = response.headers["content-type"];
        return response.data.toString("base64");
      });
    const media = new MessageMedia(mimetype, attachment, "Media");

    client
      .sendMessage(number, media, { caption: caption })
      .then((response) => {
        res.status(200).json({
          status: true,
          response: response,
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: false,
          response: err,
        });
      });
  }
);
server.listen(8000, function () {
  console.log("App running on *: " + 8000);
});
