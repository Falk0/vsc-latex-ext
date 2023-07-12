const vscode = require('vscode');

const axios = require('axios').default;
const OPENAI_API_KEY = vscode.workspace.getConfiguration('latexGpt').get('apiKey');

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {

    let disposable = vscode.commands.registerCommand('extension.openLatexGenerator', function () {
        const panel = vscode.window.createWebviewPanel(
            'latexGenerator', 
            'LaTeX Generator', 
            vscode.ViewColumn.One, 
            {
                enableScripts: true,
            }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'buttonClicked':
                        console.log("Button clicked with the input:", message.text);

                        try {
                            
                            // Get LaTeX code from GPT-3 API
                            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                            model: 'gpt-3.5-turbo',
                            messages: [{
                                role: "system",
                                content: "You are a helpful assistant that converts data or code to LaTeX tables"
                            }, {
                                role: "user",
                                content: `Please generate a LaTeX table in a format similar to this:

                                \begin{table}[ht!]
                                \centering
                                \begin{tabular}{ }\hline
                                
                                \end{tabular}
                                \caption{example}
                                \label{tab:tab1}
                                \end{table}
                                
                                for the following data ` + message.text 
                            }]
                        },  {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                            }
                        });

                            const latexCode = response.data['choices'][0]['message']['content']
                            
                            // Create a regular expression to extract the table part
                            let tableRegexp = /\\begin{table}\[ht!\](.*?)\\end{table}/s;
                            let match = latexCode.match(tableRegexp);

                            if (match) {
                                // The first group in the match contains the part between the \begin{table} and \end{table} tags
                                let tablePart = match[0];

                                // Send a new message to the webview to display the LaTeX code
                                panel.webview.postMessage({
                                    command: 'displayLatex',
                                    text: tablePart
                                });
                            } else {
                                console.log("No table found in the response.");
                            }


                            // Send a new message to the webview to display the LaTeX code

                        } catch (error) {
                            console.error(error);
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

function deactivate() {}

function getWebviewContent() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>LaTeX Table Generator</title>
        </head>
        <body>
            <h1>LaTeX Table Generator</h1>
            <form id="generator-form">
                <label for="prompt-input">Prompt:</label>
                <textarea id="prompt-input" style="width: 100%; height: 200px;"></textarea>
                <button type="submit">Generate</button>
                <button id="copy-button">Copy result to Clipboard</button>
            </form>
            <pre id="latex-output"></pre>
            <script>
                ${getWebViewScript()}
            </script>
        </body>
        </html>
    `;
}

function getWebViewScript() {
    return `
        const vscode = acquireVsCodeApi();
        document.getElementById('generator-form').addEventListener('submit', event => {
            event.preventDefault();
            const input = document.getElementById('prompt-input').value;
            vscode.postMessage({
                command: 'buttonClicked',
                text: input
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'displayLatex':
                    const output = document.getElementById('latex-output');
                    output.textContent = message.text;
                    break;
            }
        });

        document.getElementById('copy-button').addEventListener('click', event => {
            const output = document.getElementById('latex-output');
            navigator.clipboard.writeText(output.textContent).then(function() {
                console.log('Copying to clipboard was successful!');
            }, function(err) {
                console.error('Could not copy text: ', err);
            });
        });
    `;
}


module.exports = {
    activate,
    deactivate
}