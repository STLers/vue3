var VueReactivity = (function (exports) {
    'use strict';

    // 判断是否为对象
    function isObject(value) {
        return value !== null && typeof value === 'object';
    }

    let activeEffect = void 0;
    let effectStack = [];
    function isTracking() {
        return activeEffect !== null && activeEffect !== undefined;
    }
    function cleanupEffect(effect) {
        const deps = effect.deps;
        for (const dep of deps) {
            dep.delete(effect);
        }
    }
    class ReactiveEffect {
        constructor(fn) {
            this.fn = fn;
            this.active = true;
            this.deps = [];
        }
        run() {
            if (!this.active) {
                return this.fn();
            }
            try {
                activeEffect = this;
                effectStack.push(this);
                return this.fn();
            }
            finally {
                effectStack.pop();
                activeEffect = effectStack[effectStack.length - 1];
            }
        }
        // 接触effect和响应式对象的绑定
        stop() {
            if (this.active) {
                cleanupEffect(this);
                this.active = false;
            }
        }
    }
    // 收集依赖
    const targetMap = new WeakMap();
    function track(target, key) {
        if (!activeEffect) {
            return;
        }
        let depsMap = targetMap.get(target);
        if (!depsMap) {
            depsMap = new Map();
            targetMap.set(target, depsMap);
        }
        let dep = depsMap.get(key);
        if (!dep) {
            depsMap.set(key, dep = new Set());
        }
        if (!dep.has(activeEffect)) {
            dep.add(activeEffect);
            activeEffect.deps.push(dep);
        }
    }
    // 触发依赖
    function trigger(target, key) {
        const depsMap = targetMap.get(target);
        if (depsMap && key) {
            const dep = depsMap.get(key);
            const effects = [...dep];
            for (const effect of effects) {
                if (activeEffect !== effect) {
                    effect.run();
                }
            }
        }
    }
    function effect(fn) {
        const _effect = new ReactiveEffect(fn);
        _effect.run();
        const runner = _effect.run.bind(_effect);
        runner.effect = _effect;
        return runner;
    }

    const get = createGetter();
    const set = createSetter();
    const readonlyGet = createGetter(false, true);
    const shallowReadonlyGet = createGetter(true, true);
    const mutableHandlers = {
        get,
        set,
    };
    const readonlyHandlers = {
        get: readonlyGet,
        set(target, key) {
            console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
            return true;
        }
    };
    const shallowReadonlyHandlers = {
        get: shallowReadonlyGet,
        set(target, key) {
            console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
            return true;
        }
    };
    function createGetter(shallow = false, isReadonly = false) {
        return function get(target, key, receiver) {
            const isExistInReactiveMap = () => key === "__v_isRAW" /* IS_RAW */ && reactiveMap.get(target);
            const isExistInReadonlyMap = () => key === "__v_isRAW" /* IS_RAW */ && readonlyMap.get(target);
            const isExistInShallowReadonlyMap = () => key === "__v_isRAW" /* IS_RAW */ && shallowReadonlyMap.get(target);
            if (key === "__v_isReactive" /* IS_REACTIVE */) {
                return !shallow;
            }
            else if (key === "__v_isReadonly" /* IS_READONLY */) {
                return isReadonly;
            }
            else if (isExistInReactiveMap() || isExistInReadonlyMap() || isExistInShallowReadonlyMap()) {
                return target;
            }
            const ret = Reflect.get(target, key, receiver);
            if (!isReadonly) {
                track(target, key);
            }
            if (shallow) {
                return ret;
            }
            if (isObject(ret)) {
                return isReadonly ? readonly(ret) : reactive(ret);
            }
            return ret;
        };
    }
    function createSetter() {
        return function set(target, key, value, receiver) {
            const oldValue = target[key];
            const ret = Reflect.set(target, key, value, receiver);
            if (oldValue !== value) {
                trigger(target, key);
            }
            return ret;
        };
    }

    // 存储已经reactive包装的对象
    const reactiveMap = new WeakMap();
    // 存储已经readonly包装的对象
    const readonlyMap = new WeakMap();
    // 存储已经shallowReadonly包装的对象
    const shallowReadonlyMap = new WeakMap();
    function reactive(target) {
        return createReactiveObject(target, reactiveMap, mutableHandlers);
    }
    function readonly(target) {
        return createReactiveObject(target, readonlyMap, readonlyHandlers);
    }
    function shallowReadonly(target) {
        return createReactiveObject(target, shallowReadonlyMap, shallowReadonlyHandlers);
    }
    function createReactiveObject(target, proxyMap, baseHandlers) {
        // 只处理对象
        if (!isObject(target)) {
            return target;
        }
        // 避免重复包装已经处理的对象
        if (target['__v_isRAW']) {
            return target;
        }
        // 判断是否已经存在对应类型的target
        const exitingProxy = proxyMap.get(target);
        if (exitingProxy) {
            return exitingProxy;
        }
        const proxy = new Proxy(target, baseHandlers);
        // 存储target，防止重复代理
        proxyMap.set(target, proxy);
        return proxy;
    }

    exports.ReactiveEffect = ReactiveEffect;
    exports.effect = effect;
    exports.isTracking = isTracking;
    exports.reactive = reactive;
    exports.reactiveMap = reactiveMap;
    exports.readonly = readonly;
    exports.readonlyMap = readonlyMap;
    exports.shallowReadonly = shallowReadonly;
    exports.shallowReadonlyMap = shallowReadonlyMap;
    exports.targetMap = targetMap;
    exports.track = track;
    exports.trigger = trigger;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
//# sourceMappingURL=reactivity.global.js.map
