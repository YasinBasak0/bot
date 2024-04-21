  /**
   * @title Dynamic Single Choice
   * @category Message Types
   * @param {string} title
   * @param {choisePath} choisePath
   * @param {string} keyName
   */
  const myAction = async (title, choisePath, keyName = 'title') => {
    //deneme
    const optionsData = eval(choisePath)

    const options = optionsData.map(option => ({
      title: keyName ? option[keyName] : option,
      value: option
    }))

    temp.options = options

    const data = {
      text: title,
      choices: options,
      typing: true
    }

    const target = {
      botId: event.botId,
      channel: event.channel,
      target: event.target,
      threadId: event.threadId
    }

    const content = await bp.cms.renderElement('builtin_single-choice', data, target)

    await bp.events.replyToEvent(target, content, event.id)
  }

  return myAction(args.title, args.choisePath, args.keyName)
