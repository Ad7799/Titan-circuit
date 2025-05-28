function enableHackerMode() {
    // Show buttons and features for Hacker Mode
    document.getElementById('undo-btn').style.display = 'block';
    document.getElementById('redo-btn').style.display = 'block';
    document.getElementById('move-history').style.display = 'block';
    document.getElementById('leaderboard').style.display = 'block';

    window.hackerModeEnabled = true;

    // Change button to disable hacker mode
    const btn = document.getElementById('hacker-mode-btn');
    btn.textContent = 'Disable Hacker Mode';
    btn.onclick = disableHackerMode;
    
    // Reset game state and timers
    resetGame();
}

function disableHackerMode() {
    // Hide hacker mode features
    document.getElementById('undo-btn').style.display = 'none';
    document.getElementById('redo-btn').style.display = 'none';
    document.getElementById('move-history').style.display = 'none';
    document.getElementById('leaderboard').style.display = 'none';

    window.hackerModeEnabled = false;

    // Reset button to enable hacker mode
    const btn = document.getElementById('hacker-mode-btn');
    btn.textContent = 'Enable Hacker Mode';
    btn.onclick = enableHackerMode;

    // Reset the game and timers
    resetGame();
}

// Make functions globally accessible
window.enableHackerMode = enableHackerMode;
window.disableHackerMode = disableHackerMode;
window.hackerModeEnabled = false; // Initialize hacker mode to false