import { isObject } from "@vue/shared"

export function reactive(target) {
    return createReactive(target)
}

const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive'
}
// 存储已经reactive包装的对象
const reactiveMap = new WeakMap()
// proxy代理
const mutableHandlers = {
    get (target, key, receiver) {
        // 避免重复包装已经reactive处理的对象
        if (key === ReactiveFlags.IS_REACTIVE) {
            return true
        }
        const ret = Reflect.get(target, key, receiver)
        return ret
    },
    set (target, key, value, receiver) {
        const ret = Reflect.set(target, key, value, receiver)
        return ret
    }
}
function createReactive(target) {
    // 避免重复包装已经reactive处理的对象
    if (target[ReactiveFlags.IS_REACTIVE]) {
        return target
    }
    // 判断是否已经存在reactive类型的target
    const exitingProxy = reactiveMap.get(target)
    if (exitingProxy) {
        return exitingProxy
    }
    // 只处理对象
    if (!isObject(target)) {
        return target
    }
    const proxy = new Proxy(target, mutableHandlers)
    // 存储target，防止重复代理
    reactiveMap.set(target, proxy)
    return proxy
}