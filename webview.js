(function() {
    const form = document.getElementById('generator-form');
    const content = document.getElementById('content');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        let prompt = '';
        const promptInput = document.getElementById('prompt-input');
        if (promptInput instanceof HTMLInputElement) {
            prompt = promptInput.value;
        }
        content.innerHTML = '<p>Generated LaTeX code:</p><pre>\\begin{align} \\frac{{dy}}{{dx}} = 5x^{4} \\end{align}</pre>';

        const message = {
            command: 'generate',
            prompt: prompt
        };
        // Send the message to the extension script
        console.log("Sending message from webview:", message);
        window.postMessage(message, 'generate');
    });

    // Listen for messages from the extension script
    window.addEventListener('message', function(event) {
        const message = event.data;
        if (message.command === 'clear') {
            content.innerHTML = '';
        }
    });
})();