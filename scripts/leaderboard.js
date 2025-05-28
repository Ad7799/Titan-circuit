const LEADERBOARD_KEY = 'titanCircuitLeaderboard';

function saveGameResult(winner) {
    const results = JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
    results.push({ winner, date: new Date().toISOString() });
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(results));
    updateLeaderboardDisplay(); // Call to update display immediately after saving
}

function getGameResults() {
    return JSON.parse(localStorage.getItem(LEADERBOARD_KEY)) || [];
}

function updateLeaderboardDisplay() {
    const results = getGameResults();
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = ''; // Clear existing list

    let totalGames = results.length;
    let redWins = 0;
    let blueWins = 0;
    let draws = 0;

    results.forEach(game => {
        if (game.winner === 'red') {
            redWins++;
        } else if (game.winner === 'blue') {
            blueWins++;
        } else {
            draws++;
        }
    });

    // Sort players by wins for ranking
    const playerStats = [
        { player: 'Red', wins: redWins },
        { player: 'Blue', wins: blueWins }
    ].sort((a, b) => b.wins - a.wins);

    const totalGamesItem = document.createElement('li');
    totalGamesItem.textContent = `Total Games Played: ${totalGames}`;
    leaderboardList.appendChild(totalGamesItem);

    playerStats.forEach((stat, index) => {
        const rank = index + 1;
        const playerItem = document.createElement('li');
        playerItem.textContent = `${stat.player} - ${rank}${getOrdinalSuffix(rank)} place - ${stat.wins} wins`;
        leaderboardList.appendChild(playerItem);
    });

    const drawsItem = document.createElement('li');
    drawsItem.textContent = `Draws: ${draws}`;
    leaderboardList.appendChild(drawsItem);
}

function getOrdinalSuffix(i) {
    const j = i % 10, k = i % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
}

// Initial display when the page loads
document.addEventListener('DOMContentLoaded', updateLeaderboardDisplay);