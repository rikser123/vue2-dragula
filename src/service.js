import dragula from 'dragula'

if (!dragula) {
  throw new Error('[vue-dragula] cannot locate dragula.')
}

import { DragHandler } from './drag-handler'

function createDragHandler({ctx, name, drake}) {
  return new DragHandler({ ctx, name, drake })
}

export class DragulaService {
  constructor ({name, eventBus, bags, drake, options}) {
    this.options = options || {}
    this.logging = options.logging
    this.name = name
    this.bags = bags = {} // bag store
    this.eventBus = eventBus
    this.drake = drake
    this.createDragHandler = options.createDragHandler || createDragHandler
    this.events = [
      'cancel',
      'cloned',
      'drag',
      'dragend',
      'drop',
      'out',
      'over',
      'remove',
      'shadow',
      'dropModel',
      'removeModel'
    ]
  }

  log(event, ...args) {
    if (!this.logging) return
    console.log(`DragulaService [${this.name}] :`, event, ...args)
  }

  error(msg) {
    console.error(msg)
    throw new Error(msg)
  }

  get bagNames() {
    return Object.keys(this.bags)
  }

  add (name, drake) {
    drake = drake || this.drake
    this.log('add (bag)', name, drake)
    let bag = this.find(name)
    if (bag) {
      this.log('existing bags', this.bagNames)
      let errMsg = `Bag named: "${name}" already exists for this service [${this.name}]. 
      Most likely this error in cause by a race condition evaluating multiple template elements with 
      the v-dragula directive having the same bag name. Please initialise the bag in the created() life cycle hook of the VM to fix this problem.`
      this.error(msg)
    }
    this.bags[name] = drake
    if (drake.models) {
      this.handleModels(name, drake)
    }
    if (!bag.initEvents) {
      this.setupEvents(name, bag)
    }
    return bag
  }

  find (name) {
    this.log('find (bag) by name', name)
    return this.bags[name]
  }

  handleModels (name, drake) {
    drake = drake || this.drake
    this.log('handleModels', name, drake)

    if (drake.registered) { // do not register events twice
      return
    }

    const dragHandler = this.createDragHandler({ ctx: this, name, drake })

    drake.on('remove', dragHandler.remove)
    drake.on('drag', dragHandler.drag)
    drake.on('drop', dragHandler.drop)

    drake.registered = true
  }

  // convenience to set eventBus handlers via Object
  on (handlerConfig = {}) {
    let handlerNames = Object.keys(handlerConfig)

    for (let handlerName of handlerNames) {
      let handlerFunction = handlerConfig[handlerName]
      this.eventBus.$on(handlerName, handlerFunction)
    }
  }

  destroy (name) {
    this.log('destroy', name)
    let bag = this.find(name)
    if (!bag) { return }
    bag.destroy()
    this.delete(name)
  }

  delete(name) {
    delete this.bags[name]
  }

  setOptions (name, options) {
    this.log('setOptions', name, options)
    if (!name) {
      console.error('setOptions must take the name of the bag to set options for')
      return this
    }
    let bag = this.add(name, dragula(options))
    this.handleModels(name, bag)
    return this
  }

  setupEvents (name, bag) {
    this.log('setupEvents', name, bag)
    bag.initEvents = true
    let _this = this
    let emitter = type => {
      function replicate () {
        let args = Array.prototype.slice.call(arguments)
        _this.eventBus.$emit(type, [name].concat(args))
      }
      bag.on(type, replicate)
    }
    this.events.forEach(emitter)
  }

  domIndexOf (child, parent) {
    return Array.prototype.indexOf.call(
      parent.children,
      child
    )
  }

  findModelForContainer (container, drake) {
    drake = drake || this.drake
    this.log('findModelForContainer', container, drake)
    return (this.findModelContainerByContainer(container, drake) || {}).model
  }

  findModelContainerByContainer (container, drake) {
    drake = drake || this.drake
    if (!drake.models) {
      return
    }
    return drake.models.find(model => model.container === container)
  }
}

