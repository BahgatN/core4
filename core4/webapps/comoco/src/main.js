import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import VueNativeSock from 'vue-native-websocket'

import PnbiBase from 'pnbi-base/core4'
// import 'pnbi-base/core4/themes/pnbi/theme-pnbi.scss'
import THEME from 'pnbi-base/core4/themes/pnbi/theme-vuetify'
import { i18n } from 'pnbi-base/core4/translations'

Vue.use(VueNativeSock, ' ', { store: store, format: 'json', connectManually: true })

Vue.use(PnbiBase, {
  router,
  config: {
    DARK: true,
    THEME,
    TITLE: 'COMOCO',
    IGNORED_ERRORS: [],
    APP_IDENTIFIER: 'comoco'
  },
  store
})

Vue.config.productionTip = false

new Vue({
  i18n,
  router,
  store,
  render: h => h(App)
}).$mount('#app')