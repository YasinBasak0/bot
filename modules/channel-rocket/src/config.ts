export interface Config {
  /**
   * @default false
   */
  enabled: boolean;

  /**
   * @default ""
   */
  ROCKETCHAT_USER: string,
    
  /**
   * @default ""
   */
  ROCKETCHAT_PASSWORD: string,


  /**
   * @default ""
   */
  ROCKETCHAT_URL: string,

  /**
   * @default ""
   */
  ROCKETCHAT_USE_SSL: string

  /**
   * @default ""
   */
  ROCKETCHAT_ROOM: string
  
  /**
   * 
   * @default "admin,bot,chat:write:bot,commands,identify,incoming-webhook,channels:read"
   */
  scope:string
}