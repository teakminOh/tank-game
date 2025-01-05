export function setupFullScreen(app) {
    // Resize canvas to fit the screen
    function resizeCanvas() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Resize the renderer and the canvas
        app.renderer.resize(width, height);

        // Update canvas dimensions
        app.view.style.width = `${width}px`;
        app.view.style.height = `${height}px`;
    }

    // Enter full-screen mode
    function enterFullScreen() {
        if (app.view.requestFullscreen) {
            app.view.requestFullscreen();
        } else if (app.view.webkitRequestFullscreen) {
            app.view.webkitRequestFullscreen(); // For Safari
        } else if (app.view.mozRequestFullScreen) {
            app.view.mozRequestFullScreen(); // For Firefox
        } else if (app.view.msRequestFullscreen) {
            app.view.msRequestFullscreen(); // For IE/Edge
        }
    }

    // Add a button for entering full-screen (optional)
    const fullScreenButton = document.createElement('button');
    fullScreenButton.textContent = 'Go Fullscreen';
    fullScreenButton.style.position = 'absolute';
    fullScreenButton.style.top = '10px';
    fullScreenButton.style.right = '10px';
    fullScreenButton.style.zIndex = '1000';
    fullScreenButton.style.padding = '10px';
    fullScreenButton.style.fontSize = '16px';
    fullScreenButton.style.background = 'rgba(0, 0, 0, 0.7)';
    fullScreenButton.style.color = 'white';
    fullScreenButton.style.border = 'none';
    fullScreenButton.style.cursor = 'pointer';
    fullScreenButton.addEventListener('click', enterFullScreen);
    document.body.appendChild(fullScreenButton);

    // Resize the canvas on window resize
    window.addEventListener('resize', resizeCanvas);

    // Initial canvas resize
    resizeCanvas();
}
