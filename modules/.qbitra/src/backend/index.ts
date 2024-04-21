import * as sdk from 'botpress/sdk'

const onServerStarted = async (bp: typeof sdk) => { }
const onServerReady = async (bp: typeof sdk) => { }

const botTemplates: sdk.BotTemplate[] = [
  { id: 'qbot', name: 'Qbot Bot', desc: 'Provides basic functionality to use qbot services' }
]

const entryPoint: sdk.ModuleEntryPoint = {
  onServerStarted,
  onServerReady,
  botTemplates,
  definition: {
    name: 'qbitra',
    menuIcon: 'none',
    noInterface: true,
    menuText: 'Qbitra',
    fullName: 'Qbitra',
    homepage: 'https://qbot.com.tr'
  }
}

export default entryPoint
