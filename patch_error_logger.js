const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const logger = `
    <div id="error-log" style="position: fixed; top: 0; left: 0; z-index: 9999; background: red; color: white; padding: 10px; display: none; max-height: 50vh; overflow: auto; pointer-events: none;"></div>
    <script>
      window.addEventListener('error', (event) => {
        const el = document.getElementById('error-log');
        el.style.display = 'block';
        el.innerHTML += '<br>' + event.message + ' at ' + event.filename + ':' + event.lineno;
      });
      window.addEventListener('unhandledrejection', (event) => {
        const el = document.getElementById('error-log');
        el.style.display = 'block';
        el.innerHTML += '<br>Unhandled Promise: ' + (event.reason ? event.reason.message : 'Unknown');
      });
    </script>
`;
code = code.replace("</body>", logger + "\n</body>");
fs.writeFileSync('index.html', code);
