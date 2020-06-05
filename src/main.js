import Vue from 'vue'
import App from '@/App.vue'
import store from '@/store'
import vuetify from '@/plugins/vuetify'
import filters from '@/utls/filters'
import Dinero from 'dinero.js'
import Currency from '@/settings/currency.js'

Vue.config.productionTip = false;

Dinero.globalLocale = Currency.locale.code;
Dinero.defaultCurrency  = Currency.locale.CurrencyCode;
Dinero.defaultPrecision  = Currency.locale.precision;

// register global utility filters.
Object.keys(filters).forEach(key => {
  Vue.filter(key, filters[key]);
})

Vue.prototype.$currency = Currency;

new Vue({
  store,
  vuetify,
  filters,
  render: h => h(App)
}).$mount('#app')