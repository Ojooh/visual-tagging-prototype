const LoggerUtil    = require("./logger_util");

class ServerUtil {
    constructor(debug, port) {
        this.name       = "server_util"
        this.debug      = debug;
        this.logger     = new LoggerUtil(this.name);
        this.port       = port;
    }
    
    // Method to handle on server error
    onServerError = (error) => {
        if (error.syscall !== 'listen') { 
            this.logger.error("Unexpected server error", error);
            throw error; 
        }
        
        const bind = typeof this.port === 'string' ?  `Pipe ${this.port}`: `Port ${this.port}`;
  
        // Handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                this.logger.error(`${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                this.logger.error(`${bind} is already in use'`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }
    
    // Method to handle server listening
    onServerListening = (server) => {
        this.printAppBanner("visual-tagging-prototype")
        const addr      = server.address();
        const bind      = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;

        this.debug(`Listening on ${bind}`);
        
    }
  
    // Normalize a port into a number, string, or false.
    normalizePort = (port_value) => {
        const port = parseInt(port_value, 10);
  
        // named pipe
        if (isNaN(port)) { return port_value; }
    
        // port number
        if (port >= 0) { return port }
    
        return false;
    }

    // Method to print app banner
    printAppBanner = (app_name) => {
        const raw           = app_name.replace(/[-_]/g, ' ');
        const title         = raw.toUpperCase();

        const border_char    = '═';
        const corner_tl      = '╔';
        const corner_tr      = '╗';
        const corner_bl      = '╚';
        const corner_br      = '╝';
        const side_char      = '║';

        const padding       = 4;
        const content_width = title.length + padding * 2;
        const border        = border_char.repeat(content_width);

        const line1         = `${corner_tl}${border}${corner_tr}`;
        const line2         = `${side_char}${' '.repeat(padding)}${title}${' '.repeat(padding)}${side_char}`;
        const line3         = `${corner_bl}${border}${corner_br}`;

        console.log('\n' + line1);
        console.log(line2);
        console.log(line3 + '\n');
    }

  }
  
  module.exports = ServerUtil;
  