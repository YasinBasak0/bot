import _ from "lodash";
import Promise from "bluebird";
import actions from "./actions" ;
import outgoing from "./outgoing";
import RocketChat from "./rocketchat";
import UMM from "./umm";
import * as sdk from 'botpress/sdk'
import { Config } from "../config";
let rocketchat: RocketChat = null;

const outgoingMiddleware = async (event, next,bp) => {
  console.log(event)
  if (event.channel !== 'channel-rocket') {
    return next();
  }

  if (!outgoing[event.type]) {
    return next("Unsupported event type: " + event.type);
  }
  await outgoing[event.type](event, next, rocketchat,bp);
};

const onServerReady = async (bp: typeof sdk) => {
  
}

const onBotMount = async (bp: typeof sdk, botId: string) => {
  console.log('mounting meeeee')
  const config = (await bp.config.getModuleConfigForBot("channel-rocket",botId,true)) as Config;
  console.log(config)
  if(config?.enabled){
    rocketchat = new RocketChat(bp,botId,config);
  
    await rocketchat.connect();
    await rocketchat.listen(bp);
  
    bp.events.registerMiddleware({
      name: "rocketchat.sendMessages",
      direction: "outgoing",
      order: 100,
      handler: (event, next) => outgoingMiddleware(event,next,bp),
      description: "Sends messages to Rocket.Chat"
    });
  }


  // bp.rocketchat = {};
  // _.forIn(actions, (action, name) => {
  //   bp.rocketchat[name] = actions[name];
  //   const sendName = name.replace(/^create/, "send");
  //   bp.rocketchat[sendName] = Promise.method(function() {
  //     const msg = action.apply(this, arguments);
  //     return bp.middlewares.sendOutgoing(msg);
  //   });
  // });
  // UMM(bp);
}

const entryPoint: sdk.ModuleEntryPoint = {
 definition: {
   name: 'channel-rocket',
   menuIcon: 'none',
    menuText: 'Channel Rocket Chat',
    noInterface: true,
    fullName: 'Rocket Chat',
 },
  onBotMount ,

  onServerReady
};

export default entryPoint;
