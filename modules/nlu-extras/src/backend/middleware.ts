import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import _, { cond } from 'lodash'

import { Config } from '../config'

import { predict } from './engines/dialogflow'
import { witpredict, witVoicePredict } from './engines/witai'

const configPerBot: { [botId: string]: Config } = {}

export const enableForBot = (botId: string, config: Config) => {
  configPerBot[botId] = config
}

export const removeForBot = botId => delete configPerBot[botId]

export const registerMiddleware = async (bp: typeof sdk) => {
  bp.events.registerMiddleware({
    name: 'nlu-extras.incoming',
    direction: 'incoming',
    order: 129,
    description:
      'Process natural language in the form of text. Structured data with an action and parameters for that action is injected in the incoming message event.',
    handler: async (event: sdk.IO.IncomingEvent, next: sdk.IO.MiddlewareNextCallback) => {
      const config = configPerBot[event.botId]
      const dfEnabled = config && config.dialogflow && config.dialogflow.enabled
      const witEnabled = config && config.witai && config.witai.enabled
      const enabled = dfEnabled || witEnabled
      let voice = _.get(event, 'payload.attachments[0].type')
      if(voice == undefined){
        voice = _.get(event, 'payload.attachments.type')
      }
      if(voice == 'voice' && witEnabled == true){
        try {
          console.log(JSON.stringify(event))
          let url = _.get(event, 'payload.attachments[0].contentUrl')
          var result3;
          event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, true)
          result3= await witVoicePredict(config.witai, url, event.nlu.language, event.nlu.includedContexts)
          const payload = { type: 'text', text: result3.text }
          const newEvent = bp.IO.Event({...event, direction: 'incoming', payload})
          event.setFlag(bp.IO.WellKnownFlags.SKIP_DIALOG_ENGINE, false)
          await bp.events.sendEvent(newEvent)
          
        } catch (err) {
          bp.logger.warn('Error extracting NLU from WitAI: ' + err.message)
        } finally {
          next()
        }
      }

        if (!enabled || !event.preview || event.hasFlag(bp.IO.WellKnownFlags.SKIP_NATIVE_NLU)) {
          return next()
        }
        if (event.nlu.intent.name !== 'none' && config.skip == true){
          return next()
        }
  
        try {
          var result;
          if(dfEnabled == true){
            result = await predict(config.dialogflow, event.preview, event.nlu.language, event.nlu.includedContexts)
          }
  
          var result2;
          if(witEnabled  == true){
            result2 = await witpredict(config.witai, event.preview, event.nlu.language, event.nlu.includedContexts)
          }
  
  
          switch (config.primary) {
            case 'dialogflow-nlu':
                  event.nlu['engine'] = 'dialogflow'
                  event.nlu['qbot-nlu'] = _.cloneDeep(event.nlu)
                  event.nlu.intent.name = result.intent
                  event.nlu.intent.confidence = result.confidence
                  Object.assign(event.nlu, { intents: [event.nlu.intent] })
                  Object.assign(event.nlu.slots, result.slots)
                break;
            case 'witai-nlu':
                  event.nlu['engine'] = 'witai'
                  event.nlu['qbot-nlu'] = _.cloneDeep(event.nlu)
                  event.nlu.intent.name = result2.intent
                  event.nlu.intent.confidence = result2.confidence
                  Object.assign(event.nlu, { intents: [event.nlu.intent] })
                  Object.assign(event.nlu.slots, result2.slots)
                break;
            default: 
                  event.nlu['engine'] = 'qbot' 
                  if(dfEnabled == true){
                    event.nlu['dialogflow-nlu'] = { ...result, engine: 'dialogflow' }
                   }
                   if(witEnabled  == true){
                    event.nlu['witai-nlu'] = { ...result2, engine: 'witai' }
                   }     
            break;
            
         }
        } catch (err) {
          bp.logger.warn('Error extracting NLU from ExtraNLU: ' + err.message)
        } finally {
          next()
        }
      }
  })
}
