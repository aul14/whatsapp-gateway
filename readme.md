# Whatsapp API Tutorial

Hi, this is the implementation example of <a href="https://github.com/pedroslopez/whatsapp-web.js">whatsapp-web.js</a>

## Important thing!

As because Whatsapp regularly makes an update, so we needs to always **use the latest version of whatsapp-web.js**. Some errors may occurs with the old versions, so please try to update the library version before creating an issue.

### How to use?

- Clone or download this repo
- Enter to the project directory
- Run `npm install`
- Run `npm run start:dev`
- Open browser and go to address `http://localhost:8000`
- Scan the QR Code
- Enjoy!

### Send message to group

You can send the message to any group by using `chatID` or group `name`, chatID will used if you specify the `id` field in the form, so if you want to send by `name`, only use name.

**Paramaters:**

- `id` (optional if name given): the chat ID
- `name` (optional): group name
- `message`: the message

Here the endpoint: `/send-group-message`

Here the way to get the groups info (including ID & name):

- Send a message to the API number `!groups`
- The API will replying with the groups info
- Use the ID to send a message

### Downloading media

I add an example to downloading the message media if exists. Please check it in `on message` event!

We use `mime-types` package to get the file extension by it's mimetype, so we can download all of the type of media message.

And we decided (for this example) to use time as the filename, because the media filename is not certain exists.
