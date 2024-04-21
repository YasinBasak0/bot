import { DialogflowConfig } from './backend/typings'
import { WitAiConfig } from './backend/typings'

export interface Config {
  /**
   * Specify the primary NLU engine that will be used by Qbot.
   *
   * NOTE: Qbot NLU always run and can't be disabled. If another NLU is specified as primary,
   * it will run after Qbot and will overwrite the prediction results.
   * @default qbot-nlu
   */
  primary: 'qbot-nlu' | 'dialogflow-nlu' | 'witai-nlu'

    /**
   * Configuration of skip the others when found on the first
   * @default false
   */
  skip: boolean

  /**
   * Configuration of the Dialogflow NLU engine
   * @default null
   */
  dialogflow?: DialogflowConfig

    /**
   * Configuration of the WitAi NLU engine
   * @default null
   */
  witai?: WitAiConfig
}
