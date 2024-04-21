import * as sdk from 'botpress/sdk';
import RocketChat from './rocketchat';


const handlePromise = (event, next, promise) => {
  return promise
    .then(res => {
      //console.log('WE ARE GOING NEXT PROMISE')
      next();
      event._resolve && event._resolve();
      return res;
    })
    .catch(err => {
      console.log("THERE WAS AN ERROR");
      next(err);
      event._reject && event._reject(err);
      throw err;
    });
};

const handleText = async (event , next, rocketchat,bp: typeof sdk) => {
  console.log(event);
  
  //console.log("HANDLE TEXT")
  
  let text:string = event.payload.text;
  let message:any = text;
  if(event.payload.quick_replies){

    const options = event.payload.quick_replies.map(x => ({
      label: x.title,
      value: x.value,
      type: 'quick_reply'
    }))

    text += "\n" + event.payload.quick_replies.map( (elem, index) => {
     return `${index + 1}. ${elem.title}` 
    }).join('\n')

    await bp.kvs.forBot(event.botId).set(event.target, options, undefined, '10m')
    message = text;
  }
  
  if (typeof text == "string") {

    const imgRegex = /#(.*)#/;

    var image: any = imgRegex.exec(text as string);

    if (image) {
      message = [ text.replace(imgRegex, ''),image[0].slice(1, -1)]

    }

  }
  const options = {};

  return handlePromise(event, next, rocketchat.sendMessage(message, options, event));
};

const handleAttachments = (event, next, rocketchat) => {
  

  //console.log("HANDLE TEXT")
  const msg = {
    attachments: event.raw.attachments || []
  }
  const options = {};

  return handlePromise(event, next, rocketchat.sendMessage(msg, options, event));
};

const typing = (event,next,rocketchat: RocketChat) => {

}

const mapping = {
  typing: typing,
  default: handleText,
  text: handleText,
  attachments: handleAttachments
};

export default mapping;
