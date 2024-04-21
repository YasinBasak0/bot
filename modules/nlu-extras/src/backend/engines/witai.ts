import axios from 'axios'
import _ from 'lodash'
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import { Readable,PassThrough } from 'stream';
ffmpeg.setFfmpegPath(ffmpegPath.path);


import { WitAiConfig } from '../typings'

function yyyymmdd() {
  function twoDigit(n) { return (n < 10 ? '0' : '') + n; }
  var now = new Date();
  return '' + now.getFullYear() + twoDigit(now.getMonth() + 1) + twoDigit(now.getDate());
}

export const witVoicePredict = async (config: WitAiConfig, voiceUrl: string, langCode: string, contexts: string[]) => {
  const date = yyyymmdd()
  let bufferStream = new PassThrough();
  const response = await axios(voiceUrl, { responseType: 'arraybuffer' })
  ffmpeg(Readable.from(response.data)).toFormat('wav').writeToStream(bufferStream)
  const buffers = [];
  let outputBuffer;
  bufferStream.on('data', buf=> {
    buffers.push(buf);
  });

 const test = await bufferStream.on('end', async ()=> {
    outputBuffer = Buffer.concat(buffers);
  });

  const data  = await axios({
    method: 'post',
    url: `https://api.wit.ai/speech?v=${date}`,
    headers:{
      Authorization: `Bearer ${config.token}`,
      'Content-Type' : 'audio/wav',
      'Transfer-Encoding': 'chunked',
      },
      data: test
  })
  data instanceof Promise; 
  var result = { 
    text: "",
    slots: _.get(data, 'entities', {}), 
    intent: _.get(data, 'intents[0].name', 'none'),
    confidence: _.get(data,'intents[0].confidence', 1)
  }  
    const responsee = parseResponse(data.data)
    for (const rsp of responsee) {
      const {action, context_map, error, is_final, text} = rsp;  
      if (is_final) {
        result.slots = _.get(rsp, 'entities', {})
        result.intent = _.get(rsp, 'intents[0].name', 'none')
        result.confidence = _.get(rsp,'intents[0].confidence', 1)
        result.text = text
      }
    }
    return result

  
//   let result =[]
// result["slot"]= "";
// result["intent"]="";
// result["confidence"]="";

// var end = new Promise(function(resolve, reject) {
//   const bodyStream = data.data;
//   bodyStream.on('readable', () => {
//      let chunk;
//      let contents = '';
//      while (null !== (chunk = bodyStream.read())) {
//        contents += chunk.toString();
//      }
//      const responsee = parseResponse(contents)
//      for (const rsp of responsee) {
//        const {action, context_map, error, is_final, response} = rsp;   
//      if (is_final) {
//       result["slot"]= _.get(rsp, 'entities', {}),
//       result["intent"]= _.get(rsp, 'intents[0].name', 'none'),
//       result["confidence"]= _.get(rsp, 'intents[0].confidence', 1)
//      }
//    }
//    resolve(result)
//   })
// });
 
//  return end.then((value) => {
//   return value
//});

}
function delay(ms: number) {
  return new Promise( resolve => setTimeout(resolve, ms) );
}

export const witpredict = async (config: WitAiConfig, text: string, langCode: string, contexts: string[]) => {
  const date = yyyymmdd()
  const { data } = await axios.get(
    `https://api.wit.ai/message?v=${date}&q=${encodeURI(text)}`,
    {
      headers: {
        Authorization: `Bearer ${config.token}`
      }
    }
  )

 return {
  slots: _.get(data, 'entities', {}),
  intent: _.get(data, 'intents[0].name', 'none'),
  confidence: _.get(data, 'intents[0].confidence', 1)
 }
}
const parseResponse = response => {
  const chunks = response
    .split('\r\n')
    .map(x => x.trim())
    .filter(x => x.length > 0);

  let prev = '';
  let jsons = [];
  for (const chunk of chunks) {
    try {
     
      prev += chunk;
      jsons.push(JSON.parse(prev));
      prev = '';
    } catch (_e) {}
  }

  return jsons;
};
