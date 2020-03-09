const child_process = require('child_process');
module.exports = function (url) {
    let cmd = '';
    if (process.platform == 'win32') {
        cmd = 'start chrome';
    } else if (process.platform == 'linux') {
        cmd = 'xdg-open';
    } else if (process.platform == 'darwin') {
        cmd = 'open';
    }
    child_process.exec(`${cmd} "${url}"`);
}