const chatOptions = {
  hideWidget: true,
  config: {
    enableReset: true,
    enableTranscriptDownload: true,
    extraStylesheet: '/assets/modules/channel-excel/custom.css'
  }
}

const params = {
  m: 'channel-excel',
  v: 'Fullscreen',
  options: JSON.stringify(chatOptions)
}

setTimeout(() => {
  try {
    bp.http.deleteShortLink(botId)
  } catch (e) {}

  // Bot will be available at $EXTERNAL_URL/s/$BOT_NAME
  bp.http.createShortLink(botId, `${process.EXTERNAL_URL}/lite/${botId}/`, params)
}, 500)
