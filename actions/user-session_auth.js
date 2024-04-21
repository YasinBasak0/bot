  /**
   * Small description of your action
   * @title User Session isAuth
   * @category User Session
   */
  const myAction = async () => {
    event.state.user.isauth = 'true'
  }

  return myAction()