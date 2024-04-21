import {driver} from  "@rocket.chat/sdk";
import Promise from "bluebird";
import * as sdk from 'botpress/sdk'
import {Config} from '../config';

export default class RocketChat {
  private connected: boolean;
  private config: Config;
  private botId: string;
  private bp: typeof sdk;

  constructor(bp: typeof sdk, botId: string, config: Config) {
    this.bp = bp;
    this.botId = botId;
    this.config = config;
    this.connected = false;
  }

  async connect() {
    function handleChannel(channelList) {
      if (channelList !== undefined) {
        channelList = channelList.replace(/[^\w\,._]/gi, "").toLowerCase();
        if (channelList.match(",")) {
          channelList = channelList.split(",");
        } else if (channelList !== "") {
          channelList = [channelList];
        } else {
          channelList = [];
        }
      }

      return channelList;
    }

    try {
      const useSSL = this.config.ROCKETCHAT_USE_SSL === "true";
      await driver.connect({
        host: this.config.ROCKETCHAT_URL,
        useSsl: useSSL
      });
      await driver.login({
        username: this.config.ROCKETCHAT_USER,
        password: this.config.ROCKETCHAT_PASSWORD
      });
      await driver.joinRooms(handleChannel(this.config.ROCKETCHAT_ROOM));
      await driver.subscribeToMessages();
      this.connected = true;
    } catch (error) {
      console.log(error);
    }
  }

  async listen(bp: typeof sdk) {
    // Insert new user to db
    async function getOrCreateUser(message) {
      //console.log('GETORCREATEUSER')
      const userId = message.rid;
      const id = `rocketchat:${userId}`;
      // const existingUser = await bp.database("users")
      //   .where("id", id)
      //   .then(users => users[0]);
      // if (existingUser) {
      //   existingUser.id = userId;
      //   return existingUser;
      // } else {
        const newUser = {
          id: id,
          userId: userId,
          username: message.u.username,
          platform: "rocketchat",
          first_name: message.u.name,
          last_name: "",
          gender: "",
          timezone: null,
          picture_url: null,
          locale: null,
          created_on: "",
          number: userId
        };
        // await bp.database("users").insert(newUser);
        return newUser;
      // }
    }
    console.log("LISTEN TRIGGERED");
    const options = {
      dm: true,
      livechat: true,
      edited: true
    };
    let that = this;
    return driver.respondToMessages(async function(err, message, meta) {
      console.log('message',message)
      // If message have .t so it's a system message, so ignore it

     
      if (message.t === undefined) {
        const user = await getOrCreateUser(message);
        const index = Number(message.msg);
        if(index){
          message.msg = await that.handleIndex(index - 1,user.id) ?? message.msg
        }
        
        bp.events.sendEvent(bp.IO.Event({
          botId: that.botId,
          channel: "channel-rocket",
          direction: "incoming",
          payload: {
            text: message.msg,
            user: message.u
          },
          target: user.id,
          type: "text"
        }))
    }
  }, options);
  }

  async handleIndex(index: number,kvsKey:string){
    console.log('here')
    if(await this.bp.kvs.forBot(this.botId).exists(kvsKey)){
      console.log('found')
      const option = await this.bp.kvs.forBot(this.botId).get(kvsKey, `[${index}]`)
      console.log(option)
      if (!option) {
        return
      }

      await this.bp.kvs.forBot(this.botId).delete(kvsKey);
      const { type, label, value } = option
      return label;
    }

  }

  setConfig(config: Config) {
    this.config = config;
  }

  sendMessage(msg, options, event) {
    console.log(msg);
    const messageType = event.type;
    const channelId = event.channel;
    const username = event.target;
    return driver.sendToRoomId(msg,event.target.split(':')[1])
    // if (messageType !== undefined) {
    //   if (messageType == "c") {
    //     return driver.sendToRoomId(msg, channelId);
    //   } else if (messageType == "p") {
    //     return driver.sendToRoomId(msg, channelId);
    //   } else if (messageType == "d") {
    //     return driver.sendDirectToUser(msg, username);
    //   } else if (messageType == "l") {
    //     return driver.sendToRoomId(msg, channelId);
    //   } else {
    //     console.log("ERROR WHILE SENDING MESSAGE");
    //   }
    // } else {
    //   console.log("MESSAGE TYPE UNDEFINED");
    // }
  }

  sendUpdateText(ts, channelId, text) {
    return Promise.fromCallback(() => {
      driver.sendToRoomId(text, channelId, {});
    });
  }

  isConnected() {
    return this.connected;
  }

  async disconnect() {
    await driver.disconnect();
  }
}

