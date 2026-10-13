export const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "INFO", message: msg, ...meta }));
  },
  warn: (msg, meta = {}) => {
    console.warn(JSON.stringify({ timestamp: new Date().toISOString(), level: "WARN", message: msg, ...meta }));
  },
  error: (msg, meta = {}) => {
    console.error(JSON.stringify({ timestamp: new Date().toISOString(), level: "ERROR", message: msg, ...meta }));
  },
  debug: (msg, meta = {}) => {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "DEBUG", message: msg, ...meta }));
    }
  },
};

