import { isObject } from "@vue/shared"
import { track, trigger } from "./effect"
import { ReactiveFlags, reactiveMap, readonlyMap, shallowReadonlyMap, readonly, reactive } from "./reactive"

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(false, true)
const shallowReadonlyGet = createGetter(true, true)

export const mutableHandlers = {
    get,
    set,
}

export const readonlyHandlers = {
    get: readonlyGet,
    set(target, key) {
        console.warn(
            `Set operation on key "${String(key)}" failed: target is readonly.`,
            target
        );
        return true
    }
}

export const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key) {
        console.warn(
            `Set operation on key "${String(key)}" failed: target is readonly.`,
            target
        );
        return true
    }
}
function createGetter(shallow = false, isReadonly = false) {
    return function get(target, key, receiver) {
        const isExistInReactiveMap = () => key === ReactiveFlags.IS_RAW && reactiveMap.get(target)
        const isExistInReadonlyMap = () => key === ReactiveFlags.IS_RAW && readonlyMap.get(target)
        const isExistInShallowReadonlyMap = () => key === ReactiveFlags.IS_RAW && shallowReadonlyMap.get(target)

        if (key === ReactiveFlags.IS_REACTIVE) {
            return !shallow
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        } else if (isExistInReactiveMap() || isExistInReadonlyMap() || isExistInShallowReadonlyMap()) {
            return target
        }

        const ret = Reflect.get(target, key, receiver)
        if (!isReadonly) {
            track(target, key)
        }
        if (shallow) {
            return ret
        }
        if (isObject(ret)) {
            return isReadonly ? readonly(ret) : reactive(ret)
        }
        return ret
    }
}

function createSetter() {
    return function set(target, key, value, receiver) {
        const oldValue = target[key]
        const ret = Reflect.set(target, key, value, receiver)

        if (oldValue !== value) {
            trigger(target, key)
        }
        return ret
    }
}