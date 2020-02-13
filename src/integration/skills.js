'use strict';
const rpiecy = require('json-rpiecy');

class Skills {
    constructor(skills = {}) {
        this.skills = skills;
    }

    _proxySkillObject(obj) {
        let handler = {
            get(target, propKey, receiver) {
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
        console.log('original', obj);
        return new Proxy(obj, handler);
    }

    _constructSkillObject(skill) {
        let skillObj = {};
        let methods = skill.methods;
        let action = skill.action;

        for (let method of methods) {
            skillObj[method] = (...args) => {
                action(method, args);
            }
        }
        return skillObj;
    }

    get(skill, options) {
        if (!this.skills[skill]) {
            throw new Error('Skill not found: ' + skill);
        }

        return this._proxySkillObject(
            this._constructSkillObject(this.skills[skill])
        );
    }
}

module.exports = Skills;