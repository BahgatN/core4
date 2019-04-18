import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'

import { clone } from 'pnbi-base/core4/helper'
import { createObjectWithDefaultValues } from './helper'

import { jobStates, jobGroups } from './settings.js'

const debug = process.env.NODE_ENV !== 'production'
const plugins = debug ? [createLogger({})] : []

Vue.use(Vuex)

export default new Vuex.Store({
  plugins,
  state: {
    queue: {},
    socket: {
      isConnected: false,
      message: '',
      reconnectError: false
    }
  },
  actions: {},
  mutations: {
    SOCKET_ONOPEN (state, event) {
      Vue.prototype.$socket = event.currentTarget
      Vue.prototype.$socket.sendObj({ 'type': 'interest', 'data': ['queue'] })
      state.socket.isConnected = true
    },
    SOCKET_ONCLOSE (state, event) {
      state.socket.isConnected = false
    },
    SOCKET_ONERROR (state, event) {
      // ToDo: add error flow (message, pop-up etc)
      console.error(state, event)
    },
    // default handler called for all methods
    SOCKET_ONMESSAGE (state, message) {
      state.socket.message = message

      // summary - ws type notification (all jobs in queue)
      if (message.name === 'summary') {
        state.queue = groupDataAndJobStat(message.created, message.data, 'state')
      }
    },
    // mutations for reconnect methods
    SOCKET_RECONNECT (state, count) {
      console.info(state, count)
    },
    SOCKET_RECONNECT_ERROR (state) {
      // ToDo: add error flow (message, pop-up etc)
      state.socket.reconnectError = true
    }
  },
  getters: {
    ...mapGettersJobGroups(jobGroups),
    // getChartData: (state) => {
    //   return state.queue.stat
    // },
    getJobsByGroupName: (state, getters) => (groupName) => {
      return getters[groupName]
    },
    getStateCounter: (state) => (stateName) => {
      if (state.queue.stat === undefined) return 0

      return stateName.reduce((previousValue, currentItem) => {
        previousValue += state.queue.stat[currentItem] || 0

        return previousValue
      }, 0)
    }
  }
})

// ================================================================= //
// Private methods
// ================================================================= //

/**
 * Getter(s) for job(s) group from store
 *
 * @param {array} arr -  group(s)
 *                       e.g. ['waiting', 'running', 'stopped']
 *
 * @returns {object} - object with key - group name, value - getter function
 *                     e.g. {'running': (state) => f, ...}
 */
function mapGettersJobGroups (arr) {
  return arr.reduce((computedResult, currentItem) => {
    computedResult[currentItem] = (state) => {
      return clone(state.queue[currentItem] || [])
    }

    return computedResult
  }, {})
}

/**
 * Assort array of all jobs in groups + get job statistic
 *
 * @param {string} created - timestamp
 * @param {array} arr - array of all jobs
 * @param {string} groupingKey - job object key by which we will do grouping
 *
 * @returns {object} - grouped jobs object
 *                     e. g. {'stat': {'waiting': 5, ...}, 'running': [<job>, ..., <job>], ...}
 */
// ToDo: elegant decouple group data and job statistic
function groupDataAndJobStat (created, arr, groupingKey) {
  let groupsDict = {}
  let initialState = createObjectWithDefaultValues(jobStates)

  arr.forEach((job) => {
    let jobState = job[groupingKey]
    let group = jobStates[jobState] || 'other';

    (groupsDict[group] = groupsDict[group] || []).push(job)

    initialState[jobState] += job['n']
    // initialState['created'] = created // moment(created).utc().valueOf()
  })

  return { 'stat': initialState, ...groupsDict }
}
