# Titan's Circuit

Titan's Circuit is a competitive, turn-based strategy board game implemented in JavaScript and HTML. The game simulates a futuristic battle between two players—Red and Blue—who compete to control a hexagonal grid by strategically placing and moving their "Titans" across interconnected circuits.

## Features

- **Interactive Hexagonal Board**: Responsive hex grid with three interconnected circuits.
- **Turn-Based Gameplay**: Red and Blue players alternate turns to place and move Titans.
- **Placement and Movement Phases**: Players first place Titans, then move them to control territory.
- **Elimination Mechanic**: Titans can be eliminated if surrounded on specific nodes.
- **Score and Timer**: Live scoring, individual turn timers, and an overall game timer.
- **Undo/Redo and Reset**: Players can undo/redo moves or reset the game.
- **"Hacker Mode"**: Optional mode for additional gameplay features (details in code).
- **Move History**: Viewable move history for strategy tracking.
- **Leaderboard**: Track game results and player rankings (see `scripts/leaderboard.js`).

## Getting Started

Open `index.html` in your web browser to play the game locally. No server setup is required.

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari, etc.)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/adarshhinsodiya/Titan-Circuit.git
    ```
2. Open the project directory:
    ```bash
    cd Titan-Circuit
    ```
3. Open `index.html` in your browser.

## How to Play

1. **Placement Phase**: Each player takes turns placing their Titans on available nodes, starting from the outer circuit.
2. **Unlocking Circuits**: When a circuit is fully occupied, the next inner circuit is unlocked.
3. **Movement Phase**: After all Titans are placed, players take turns moving Titans to adjacent nodes.
4. **Titan Elimination**: If a Titan is surrounded on certain nodes, it is eliminated from the board.
5. **Winning**: The player with the highest score when the inner circuit is filled, or when time runs out, wins the game.

### Controls

- **Undo/Redo**: Use the Undo and Redo buttons to revert or reapply moves.
- **Pause/Reset**: Pause or reset the game at any time.
- **Hacker Mode**: Enable for additional gameplay features.

## Repository Structure

- `index.html` — Main HTML file.
- `game.js` — Core game logic, board setup, and gameplay mechanics.
- `styles/style.css` — Styling for the board and UI.
- `scripts/leaderboard.js` — Leaderboard and results storage.
- `sounds/` — Sound effects for game actions.

## Contributing

Feel free to submit issues or pull requests to improve the game, add features, or fix bugs!

## License

This project is open-source.

---

Enjoy playing Titan's Circuit!
