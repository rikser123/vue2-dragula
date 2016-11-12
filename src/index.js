import VueDragula from './vue-dragula'

function plugin (Vue, options = {}) {
  if (plugin.installed) {
    console.warn('[vue-dragula] already installed.')
  }

  console.log('Add Dragula plugin:', options)
  VueDragula(Vue, options)
}

plugin.version = '1.0.0'

export default plugin

// make it possible to subclass service
import { default as DService } from './service'
export const DragulaService = DService

if (typeof define === 'function' && define.amd) { // eslint-disable-line
  define([], () => { plugin }) // eslint-disable-line
} else if (window.Vue) {
  window.Vue.use(plugin)
}
