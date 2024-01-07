let activeEffect = void 0
let effectStack = []

export function isTracking() {
    return activeEffect !== null && activeEffect !== undefined
}

function cleanupEffect(effect) {
    const deps = effect.deps
    for (const dep of deps) {
        dep.delete(effect)
    }

}
export class ReactiveEffect {
    active = true
    deps = []
    constructor(public fn) { }

    run() {
        if (!this.active) {
            return this.fn()
        }
        try {
            activeEffect = this
            effectStack.push(this)
            return this.fn()
        } finally {
            effectStack.pop()
            activeEffect = effectStack[effectStack.length - 1]
        }
    }
    // 接触effect和响应式对象的绑定
    stop() {
        if (this.active) {
            cleanupEffect(this)
            this.active = false
        }
    }
}

// 收集依赖
export const targetMap = new WeakMap()
export function track(target, key) {
    if (!activeEffect) {
        return
    }
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if (!dep) {
        depsMap.set(key, dep = new Set())
    }
    if (!dep.has(activeEffect)) {
        dep.add(activeEffect)
        activeEffect.deps.push(dep)
    }
}

// 触发依赖
export function trigger(target, key) {
    const depsMap = targetMap.get(target)
    if (depsMap && key) {
        const dep = depsMap.get(key)
        const effects = [...dep]
        for (const effect of effects) {
            if (activeEffect !== effect) {
                effect.run()
            }
        }
    }
}

export function effect(fn) {
    const _effect = new ReactiveEffect(fn)
    _effect.run()
    const runner = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}