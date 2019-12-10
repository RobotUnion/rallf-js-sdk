const Skills = require('../src/integration/skills');
const Logger = require('../src/integration/logger');
const AbstractLogger = require('../src/abstract/logger-abstract');

let logger = new Logger(process, true, this);

let skills = new Skills({
    logger: {
        methods: [
            ...Object.getOwnPropertyNames(Logger.prototype),
            ...Object.getOwnPropertyNames(AbstractLogger.prototype),
        ],
        action: (method, args) => {
            logger[method](...args);
        },
    }
});

let logger = skills.get('logger');
logger.debug();