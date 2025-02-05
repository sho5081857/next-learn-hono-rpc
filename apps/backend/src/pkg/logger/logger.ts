// import { Hono } from "hono";
// import { logger } from "hono/logger";
// import { env } from "process";

// const app = new Hono();

// const logFile = env.APP_LOG_FILE || "app.log";
// const isDevelopment = env.APP_ENV === "development";

// app.use(
//   "*",
//   logger({
//     level: isDevelopment ? "debug" : "info",
//     transport: {
//       target: "pino-pretty",
//       options: {
//         destination: logFile,
//         colorize: isDevelopment,
//       },
//     },
//   })
// );

// export const infoLogger = (message: string, ...rest: string[]) => {
//   console.log(message, ...rest);
// };

// export const log = {
//   info: (msg: string, ...args: any[]) => app.log.info(msg, ...args),
//   debug: (msg: string, ...args: any[]) => app.log.debug(msg, ...args),
//   warn: (msg: string, ...args: any[]) => app.log.warn(msg, ...args),
//   error: (msg: string, ...args: any[]) => app.log.error(msg, ...args),
//   fatal: (msg: string, ...args: any[]) => app.log.fatal(msg, ...args),
//   panic: (msg: string, ...args: any[]) => app.log.fatal(msg, ...args), // hono/logger does not have a panic level, using fatal
// };

// export default app;
