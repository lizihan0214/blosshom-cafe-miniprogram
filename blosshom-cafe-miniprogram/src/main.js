import Vue from 'vue'
import App from './App'
import { hydrateCart } from './store/cart'

Vue.config.productionTip = false
App.mpType = 'app'
hydrateCart()
const app = new Vue({ ...App })
app.$mount()
