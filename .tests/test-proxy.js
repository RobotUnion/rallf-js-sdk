function traceMethodCalls(obj) {
    let handler = {
        get(target, propKey, receiver) {
            console.log();
            const origMethod = target[propKey];
            if (origMethod) {
                return function (...args) {
                    let result = origMethod.apply(this, args);
                    console.log(propKey + JSON.stringify(args)
                        + ' -> ' + JSON.stringify(result));
                    return result;
                };
            } else {
                return function (...args) {
                    console.warn('WARN - Method ' + propKey + ' not implemented.');
                    return null;
                };
            }
        }
    };
    return new Proxy(obj, handler);
}

let obj = {
    pineaple(...args) {
        console.log('Called pineaples with', args);
    }
};

let proxiedObj = traceMethodCalls(obj);
proxiedObj.banana();
proxiedObj.pineaple('juice');