import { isObject } from "@vue/shared"
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly',
    IS_RAW = '__v_isRAW'
}
// 存储已经reactive包装的对象
export const reactiveMap = new WeakMap()
// 存储已经readonly包装的对象
export const readonlyMap = new WeakMap()
// 存储已经shallowReadonly包装的对象
export const shallowReadonlyMap = new WeakMap()

export function reactive(target) {
    return createReactiveObject(target, reactiveMap, mutableHandlers)
}

export function readonly(target) {
    return createReactiveObject(target, readonlyMap, readonlyHandlers)
}

export function shallowReadonly(target) {
    return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers)
}

function createReactiveObject(target, proxyMap, baseHandlers) {
    // 只处理对象
    if (!isObject(target)) {
        return target
    }
    // 避免重复包装已经处理的对象
    if (target['__v_isRAW']) {
        return target
    }
    // 判断是否已经存在对应类型的target
    const exitingProxy = proxyMap.get(target)
    if (exitingProxy) {
        return exitingProxy
    }

    const proxy = new Proxy(target, baseHandlers)
    // 存储target，防止重复代理
    proxyMap.set(target, proxy)
    return proxy
}