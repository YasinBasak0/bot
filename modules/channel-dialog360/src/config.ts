export interface Config {
  /**
   * Enable or disable this channel for this bot
   * @default false
   */
  enabled: boolean

  /**
   * API key found in here: https://docs.360dialog.com/whatsapp-api/whatsapp-api/sandbox#1-get-a-test-api-key
   * @default "your api key here"
   */
  apiKey: string

  /**
   *  Base URL of Dialog360 API server
   *  @default "https://waba-sandbox.360dialog.io/"
   */
  baseUrl: string

  /**
   * Dialog 360 API version.
   * @default "v1"
   */
  apiVersion: string

  /**
   * Dialog 360 RestAPI url format.
   * @default "{baseUrl}/{apiVersion}/{action}"
   */
  apiUrlFormat: string

  fromNumber: string
}
