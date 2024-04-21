  /**
   * Small description of your action
   * @title User Session Create
   * @category User Session
   * @param {string} id
   * @param {string} name
   * @param {string} email
   * @param {string} phone
   */
  const myAction = async (id, name, email, phone) => {
    event.state.user = { id: id, name: name, email: email, phone: phone, auth: 'true' }
  }

  return myAction(args.id, args.name, args.email, args.phone)