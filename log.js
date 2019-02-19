function log(...args) {
  console.log(...args);
}

log.i = (...args) => console.info(...args);
log.w = (...args) => console.warn(...args);
log.e = (...args) => console.error(...args);

module.exports = log;
