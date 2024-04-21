  var dfAction = require('./df-action')

  /**
   * @title Return the month before the entered date
   * @category NLU
   * @author i.tunga
   * @param {string} month - Month or Date
   */

  const payrollAction = async month => {
    let reg = /^([1-9]|10|11|12)$/
    let now = new Date()

    if (reg.test(month)) {
      let ret = validationMonth(now.setMonth(month - 1))
      Object.assign(event.state.temp, { year: ret.getFullYear(), month: ret.getMonth() + 1, tarStatu: true })
    } else {
      let dfReturn = await dfAction.myAction(month + ' bordro')
      //Object.assign(event.state.temp, { dfReturn })

      let fields = dfReturn.response.parameters
      if (dfReturn.response.intent.displayName === 'bordro') {
        if (dfReturn.response.parameters.fields.dateperiod.kind === 'structValue') {
          let tarih = new Date(dfReturn.response.parameters.fields.dateperiod.structValue.fields.endDate.stringValue)
          let ret = validationMonth(tarih)
          Object.assign(event.state.temp, { year: ret.getFullYear(), month: ret.getMonth() + 1, tarStatu: true })
        } else {
          Object.assign(event.state.temp, { tarStatu: false })
        }
      } else {
        Object.assign(event.state.temp, { tarStatu: false })
      }
    }

    function validationMonth(date) {
      let inputDate = new Date(date)
      let now = new Date()

      if (inputDate.getFullYear() >= now.getFullYear()) {
        if (inputDate.getMonth() > now.getMonth()) {
          inputDate.setFullYear(now.getFullYear() - 1)
        } else if (inputDate.getMonth() === 0) {
          inputDate.setFullYear(now.getFullYear() - 1)
          inputDate.setMonth(11)
        }
      }
      return inputDate
    }
  }

  return payrollAction(args.month)