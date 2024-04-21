  /**
   * @title User Session Reset
   * @category User Session
   * @author i.tunga
   */
  const myAction = async () => {
    event.state.user = { timezone: -3, language: 'en' }
  }

  return myAction()