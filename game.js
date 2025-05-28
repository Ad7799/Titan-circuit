document.addEventListener("DOMContentLoaded", () => {
  // Game constants
  const PLAYER_RED = "red"; // Identifier for the red player
  const PLAYER_BLUE = "blue"; // Identifier for the blue player
  const TOTAL_TITANS = 4; // Total number of titans each player can place
  const TOTAL_GAME_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
  const TURN_TIME = 30 * 1000; // 30 seconds in milliseconds

  let hackerModeEnabled = false; // Flag to indicate if hacker mode is enabled

  // Game state object to track the current state of the game
  let gameState = {
    currentPlayer: PLAYER_RED, // Tracks whose turn it is
    phase: "placement", // 'placement' or 'movement'
    redScore: 0, // Score for the red player
    blueScore: 0, // Score for the blue player
    redTitansPlaced: 0, // Number of titans placed by the red player
    blueTitansPlaced: 0, // Number of titans placed by the blue player
    redTitansRemaining: TOTAL_TITANS, // Titans remaining for the red player
    blueTitansRemaining: TOTAL_TITANS, // Titans remaining for the blue player
    nodes: [], // array to store all nodes
    edges: [], // array to store all edges connecting the nodes
    unlockedCircuit: 1, // 1 = outer, 2 = middle, 3 = inner
    gameOver: false, // Flag to indicate if the game is over
    gamePaused: false, // Flag to indicate if the game is paused
    overallTimer: null, // Timer for overall game time
    turnTimer: null, // Timer for current player's turn
    overallTimeRemaining: TOTAL_GAME_TIME, // remaining overall game time
    turnTimeRemaining: TURN_TIME, // remaining time for current player's turn
    selectedNode: null, // currently selected node for movement
    lastUpdateTime: Date.now(), // last time the game state was updated
  };

  // DOM elements
  const hexGrid = document.getElementById("hex-grid"); // Hexagonal grid container
  const scoreRed = document.getElementById("score-red"); // Score display for red player
  const scoreBlue = document.getElementById("score-blue"); // Score display for blue player
  const titansRed = document.getElementById("titans-red"); // Titans remaining for red player
  const titansBlue = document.getElementById("titans-blue"); // Titans remaining for blue player
  const timerRed = document.getElementById("timer-red"); // Timer display for red player
  const timerBlue = document.getElementById("timer-blue"); // Timer display for blue player
  const playerRed = document.getElementById("player-red"); // Player turn indicator for red player
  const playerBlue = document.getElementById("player-blue"); // Player turn indicator for blue player
  const gameStatus = document.getElementById("game-status"); // Game status display
  const pauseBtn = document.getElementById("pause-btn"); // Pause button
  const resetBtn = document.getElementById("reset-btn"); // Reset button
  const undoBtn = document.getElementById("undo-btn"); // Undo button
  const redoBtn = document.getElementById("redo-btn"); // Redo button
  const hackerModeBtn = document.getElementById("hacker-mode-btn"); // Button to enable hacker mode

  // Move history
  let moveHistory = []; // Array to store the history of moves
  let redoStack = []; // Array to store moves that can be redone

  // Sound effects
  const sounds = {
    move: new Audio("./sounds/move.mp3"), // Sound for moving a titan
    undo: new Audio("./sounds/undo.mp3"), // Sound for undoing a move
    redo: new Audio("./sounds/redo.mp3"), // Sound for redoing a move
    elimination: new Audio("./sounds/elimination.mp3"), // Sound for titan elimination
    place: new Audio("./sounds/place.mp3"), // Sound for placing a titan
    victory: new Audio("./sounds/victory.mp3"), // Sound for victory
    defeat: new Audio("./sounds/defeat.mp3"), // Sound for defeat
  };

  // Function to play sound effects
  function playSound(action) {
    if (window.hackerModeEnabled && sounds[action]) sounds[action].play(); // Play the sound for the given action
  }

  // Initialize the game
  function initGame() {
    createHexGrid(); // Create the hexagonal grid
    updateUI(); // Update the UI
    startTimers(); // Start the timers
    setupEventListeners(); // Setup event listeners
  }

  // Create the hexagonal grid
  function createHexGrid() {
    // Clear existing grid
    hexGrid.innerHTML = "";
    gameState.nodes = [];
    gameState.edges = [];

    // Create three concentric hexagons
    const centerX = 50; // x-coordinate of the center of the grid
    const centerY = 50; // y-coordinate of the center of the grid
    const hexagons = [
      { radius: 45, weight: 1 }, // Outer
      { radius: 30, weight: 2 }, // Middle
      { radius: 15, weight: 3 }, // Inner
    ]; // Array of hexagon parameters

    // Create nodes for each hexagon
    hexagons.forEach((hexagon, hexIndex) => {
      const circuit = hexIndex + 1; // 1, 2, or 3

      for (let i = 0; i < 6; i++) {
        const angle = ((i * 60 - 30) * Math.PI) / 180; // calculating angles for each node
        const x = centerX + hexagon.radius * Math.cos(angle); // x-coordinate of the node calculated based on the radius and angle
        const y = centerY + hexagon.radius * Math.sin(angle); // y-coordinate of the node calculated based on the radius and angle

        const node = {
          id: `node-${circuit}-${i}`,
          circuit,
          position: i,
          x,
          y,
          occupied: null, // null, 'red', or 'blue'
          element: null,
        }; // Object representing a node

        gameState.nodes.push(node); // Add the node to the game state
      }
    });

    // Create edges between nodes
    // Inner connections (within each hexagon)
    for (let circuit = 1; circuit <= 3; circuit++) {
      for (let i = 0; i < 6; i++) {
        const next = (i + 1) % 6; // Next node in the circuit
        const node1 = gameState.nodes.find(
          (n) => n.circuit === circuit && n.position === i
        ); // current node in the circuit
        const node2 = gameState.nodes.find(
          (n) => n.circuit === circuit && n.position === next
        ); // next node in the circuit

        if (node1 && node2) {
          gameState.edges.push({
            node1: node1.id,
            node2: node2.id,
            weight: hexagons[circuit - 1].weight,
            controlledBy: null,
          });
        } // if the nodes exist, create an edge between them with the weight of the hexagon previously mentioned
      }
    }

    // Define specific connection points between circuits
    // Only connect at specific positions between circuit 1 and 2
    const circuit1to2Connections = [0, 2, 4]; // Connect at these positions
    for (let pos of circuit1to2Connections) {
      const node1 = gameState.nodes.find(
        (n) => n.circuit === 1 && n.position === pos
      ); // node of circuit 1 at the positions mentioned in the circuit1to2Connections array
      const node2 = gameState.nodes.find(
        (n) => n.circuit === 2 && n.position === pos
      ); // node of circuit 2 at the positions mentioned in the circuit1to2Connections array

      if (node1 && node2) {
        gameState.edges.push({
          node1: node1.id,
          node2: node2.id,
          weight: hexagons[0].weight, // Weight of circuit 1
          controlledBy: null,
        });
      } // if the nodes exist, create an edge between them with the weight of circuit 1
    }

    // Only connect at specific positions between circuit 2 and 3
    const circuit2to3Connections = [1, 3, 5]; // Connect at different positions
    for (let pos of circuit2to3Connections) {
      const node1 = gameState.nodes.find(
        (n) => n.circuit === 2 && n.position === pos
      ); // node of circuit 2 at the positions mentioned in the circuit2to3Connections array
      const node2 = gameState.nodes.find(
        (n) => n.circuit === 3 && n.position === pos
      ); // node of circuit 3 at the positions mentioned in the circuit2to3Connections array

      if (node1 && node2) {
        gameState.edges.push({
          node1: node1.id,
          node2: node2.id,
          weight: hexagons[1].weight, // Weight of circuit 2
          controlledBy: null,
        });
      } // if the nodes exist, create an edge between them with the weight of circuit 2
    }

    // Render nodes and edges
    renderGrid();
  }

  // Render the grid
  function renderGrid() {
    // Clear existing grid
    hexGrid.innerHTML = "";

    const container = document.createElement("div"); // Create a container for the hex grid
    container.className = "hexagon"; // Add a class to the container
    hexGrid.appendChild(container); // Add the container to the hex grid

    // Render edges first (so they appear behind nodes)
    gameState.edges.forEach((edge) => {
      // for each edge in the game state
      const node1 = gameState.nodes.find((n) => n.id === edge.node1); // node1 is the node that is connected to the edge
      const node2 = gameState.nodes.find((n) => n.id === edge.node2); // node2 is the node that is connected to the edge

      if (node1 && node2) {
        // if the nodes exist
        const edgeElement = document.createElement("div"); // Create edge element
        edgeElement.className = "edge"; // Add a class to the edge

        // Calculate edge position and dimensions
        const x1 = node1.x; // x-coordinate of node1
        const y1 = node1.y; // y-coordinate of node1
        const x2 = node2.x; // x-coordinate of node2
        const y2 = node2.y; // y-coordinate of node2

        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)); // length of the edge calculated using the distance formula
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI; // angle of the edge calculated using the arctangent function

        edgeElement.style.width = `${length}%`; // width of the edge is set to the length of the edge
        edgeElement.style.left = `${x1}%`; // left position of the edge is set to the x-coordinate of node1
        edgeElement.style.top = `${y1}%`; // top position of the edge is set to the y-coordinate of node1
        edgeElement.style.transformOrigin = "0 0"; // transform origin of the edge is set to 0,0
        edgeElement.style.transform = `rotate(${angle}deg)`; // transform of the edge is set to the angle of the edge

        if (edge.controlledBy) {
          // if the edge is controlled by a player
          edgeElement.classList.add("highlight"); // highlight it
          edgeElement.style.backgroundColor =
            edge.controlledBy === PLAYER_RED ? "#ff5252" : "#4285f4"; // set the background color of the edge to the color of the player who controlled it
        }

        // Add edge weight label
        const weightLabel = document.createElement("div"); // Create edge weight label
        weightLabel.className = "edge-weight"; // Add a class to the edge weight label
        weightLabel.textContent = edge.weight; // Set the text content of the edge weight label to the weight of the edge

        // Position label in the middle of the edge
        const midX = (x1 + x2) / 2; // x-coordinate of the middle of the edge
        const midY = (y1 + y2) / 2; // y-coordinate of the middle of the edge
        weightLabel.style.left = `${midX}%`; // left position of the edge weight label is set to the x-coordinate of the middle of the edge
        weightLabel.style.top = `${midY}%`; // top position of the edge weight label is set to the y-coordinate of the middle of the edge

        container.appendChild(edgeElement); // Add the edge weight label to the container
        container.appendChild(weightLabel); // Add the edge weight label to the container
      }
    });

    // Render nodes
    gameState.nodes.forEach((node) => {
      // for each node in the game state
      const nodeElement = document.createElement("div"); // Create node element
      nodeElement.className = "node"; // Add a class to the node element
      nodeElement.id = node.id; // Set the id of the node element to the id of the node defined in the game state

      // Position the node
      nodeElement.style.left = `${node.x}%`; // left position of the node element is set to the x-coordinate of the node defined in the game state
      nodeElement.style.top = `${node.y}%`; // top position of the node element is set to the y-coordinate of the node defined in the game state

      // Set occupied color if applicable
      if (node.occupied) {
        nodeElement.classList.add(`occupied-${node.occupied}`);
      }

      // Disable nodes that are in locked circuits
      if (node.circuit > gameState.unlockedCircuit) {
        // if the circuit of the node is greater than the unlocked circuit
        nodeElement.classList.add("locked"); // add a class to the node element to make it look locked
        nodeElement.style.pointerEvents = "none"; // make the node element unclickable
        nodeElement.style.opacity = "0.5"; // make the node element look faded
      } else {
        // Make sure unlocked nodes are fully visible
        nodeElement.classList.remove("locked"); // remove the class from the node element to make it look unlocked
        nodeElement.style.pointerEvents = "auto"; // make the node element clickable
        nodeElement.style.opacity = "1"; // make the node element look normal
      }

      container.appendChild(nodeElement); // Add the node element to the container
      node.element = nodeElement; // Add the node element to the node object
    });
  }

  // Update the UI based on game state
  function updateUI() {
    // function to update the UI
    // Update scores
    scoreRed.textContent = gameState.redScore; // set the text content of the scoreRed element to the redScore defined in the game state
    scoreBlue.textContent = gameState.blueScore; // set the text content of the scoreBlue element to the blueScore defined in the game state

    // Update titan counts
    titansRed.textContent = gameState.redTitansRemaining; // set the text content of the titansRed element to the redTitansRemaining defined in the game state
    titansBlue.textContent = gameState.blueTitansRemaining; // set the text content of the titansBlue element to the blueTitansRemaining defined in the game state

    // Update player turn indicators
    playerRed.classList.toggle(
      "active",
      gameState.currentPlayer === PLAYER_RED && !gameState.gameOver
    ); // toggle the active class of the playerRed element to true if the currentPlayer defined in the game state is PLAYER_RED and the game is not over
    playerBlue.classList.toggle(
      "active",
      gameState.currentPlayer === PLAYER_BLUE && !gameState.gameOver
    ); // toggle the active class of the playerBlue element to true if the currentPlayer defined in the game state is PLAYER_BLUE and the game is not over

    // Update game status text
    if (gameState.gameOver) {
      // if the game is over
      if (gameState.redScore > gameState.blueScore) {
        // if the redScore defined in the game state is greater than the blueScore defined in the game state
        gameStatus.textContent = "Game Over - Red Player Wins!"; // set the text content of the gameStatus element to 'Game Over - Red Player Wins!'
      } else if (gameState.blueScore > gameState.redScore) {
        // if the blueScore defined in the game state is greater than the redScore defined in the game state
        gameStatus.textContent = "Game Over - Blue Player Wins!"; // set the text content of the gameStatus element to 'Game Over - Blue Player Wins!'
      } else {
        // if the redScore defined in the game state is equal to the blueScore defined in the game state
        gameStatus.textContent = "Game Over - Draw!"; // set the text content of the gameStatus element to 'Game Over - Draw!'
      }
    } else if (gameState.gamePaused) {
      // if the game is paused
      gameStatus.textContent = "Game Paused"; // set the text content of the gameStatus element to 'Game Paused'
    } else {
      // if the game is not over and not paused
      const phaseText =
        gameState.phase === "placement" ? "Placement Phase" : "Movement Phase"; // set the text content of the gameStatus element to the currentPlayer defined in the game state
      gameStatus.textContent = `${
        gameState.currentPlayer === PLAYER_RED ? "Red" : "Blue"
      } Player's Turn (${phaseText})`; // set the text content of the gameStatus element to the currentPlayer defined in the game state
    }

    // Update timers
    updateTimerDisplays(); // call the updateTimerDisplays function
  }

  // Update timer displays
  function updateTimerDisplays() {
    // function to update the timer displays
    const formatTime = (ms) => {
      // function to format the time in minutes and seconds using milliseconds
      const minutes = Math.floor(ms / 60000); // calculate the minutes
      const seconds = Math.floor((ms % 60000) / 1000); // calculate the seconds
      return `${minutes}:${seconds.toString().padStart(2, "0")}`; // return the time in minutes and seconds
    };

    timerRed.textContent = formatTime(
      gameState.currentPlayer === PLAYER_RED
        ? gameState.turnTimeRemaining
        : gameState.overallTimeRemaining
    ); // if it is red player's turn, display the red's turn time remaining, otherwise display the overall time remaining
    timerBlue.textContent = formatTime(
      gameState.currentPlayer === PLAYER_BLUE
        ? gameState.turnTimeRemaining
        : gameState.overallTimeRemaining
    ); // if it is blue player's turn, display the blue's turn time remaining, otherwise display the overall time remaining
  }

  // Start game timers
  function startTimers() {
    // function to start the timers
    gameState.lastUpdateTime = Date.now(); // set the lastUpdateTime defined in the game state to the current time

    // Clear existing timers
    if (gameState.overallTimer) clearInterval(gameState.overallTimer); // clear the overallTimer defined in the game state
    if (gameState.turnTimer) clearInterval(gameState.turnTimer); // clear the turnTimer defined in the game state

    // Overall game timer
    gameState.overallTimer = setInterval(() => {
      // set the overallTimer defined in the game state to an interval that calls the function every 1000 milliseconds
      if (!gameState.gamePaused && !gameState.gameOver) {
        // if the game is not paused and not over
        const now = Date.now(); // set the now variable to the current time
        const elapsed = now - gameState.lastUpdateTime; // calculate the elapsed time
        gameState.overallTimeRemaining -= elapsed; // subtract the elapsed time from the overallTimeRemaining defined in the game state
        gameState.lastUpdateTime = now; // set the lastUpdateTime defined in the game state to the current time

        // Update turn timer for current player
        if (gameState.currentPlayer === PLAYER_RED) {
          // if it is red player's turn
          gameState.turnTimeRemaining -= elapsed; // subtract the time from the red's turn timer
        } else {
          // if it is blue player's turn
          gameState.turnTimeRemaining -= elapsed; // subtract the time from the blue's turn timer
        }

        // Check if turn time expired
        if (gameState.turnTimeRemaining <= 0) {
          // if the turn time has expired
          endTurn(); // end the current player's turn
        }

        // Check if game time expired
        if (gameState.overallTimeRemaining <= 0) {
          // if the game time has expired
          endGame(); // end the game
        }

        updateTimerDisplays(); // call the updateTimerDisplays function
      }
    }, 1000);
  }

  // Setup event listeners
  function setupEventListeners() {
    // function to setup the event listeners
    // Node click handler
    hexGrid.addEventListener("click", handleNodeClick);

    // Pause button
    pauseBtn.addEventListener("click", handlePauseClick);

    // Reset button
    resetBtn.addEventListener("click", handleResetClick);

    // Undo/Redo buttons
    undoBtn.addEventListener("click", handleUndo);
    redoBtn.addEventListener("click", handleRedo);

    // Hacker mode button
    hackerModeBtn.addEventListener("click", enableHackerMode);
  }

  // Event handler functions (defined separately to allow removal)
  function handleNodeClick(e) {
    // function to handle the node click
    if (gameState.gameOver || gameState.gamePaused) return; // if the game is over or paused, return (no node can be clicked now)

    const nodeElement = e.target.closest(".node"); // get the node element that was clicked
    if (!nodeElement) return; // if no node element was clicked, return (no node can be clicked now)

    const nodeId = nodeElement.id; // get the id of the node element that was clicked
    const node = gameState.nodes.find((n) => n.id === nodeId); // get the node object that correponds to the node element that a clicked

    if (!node || node.circuit > gameState.unlockedCircuit) return; // if the node is not found or the circuit of the node is greater than the unlocked circuit return (no node can be clicked now)

    if (gameState.phase === "placement") {
      // if the phase is placement
      handlePlacement(node); // call the handlePlacement function
    } else {
      // if the phase is movement
      handleMovement(node); // call the handleMovement function
    }
  }

  function handlePauseClick() {
    // function to handle the pause click
    gameState.gamePaused = !gameState.gamePaused; // toggle the gamePaused defined in the game state
    pauseBtn.textContent = gameState.gamePaused ? "Resume" : "Pause"; // if the game is paused, change the text content of the pause button to 'Resume', otherwise change it to 'Pause
    updateUI(); // update the UI

    if (!gameState.gamePaused) {
      // if the game is not paused
      gameState.lastUpdateTime = Date.now(); // set the lastUpdateTime defined in the game state to the current time
    }
  }

  function handleResetClick() {
    // function to handle the reset click
    if (confirm("Are you sure you want to reset the game?")) {
      // if the user confirms the reset
      resetGame(); // reset the game
    }
  }

  function handleUndo() {
    // function to handle the undo click
    if (moveHistory.length === 0) return; // if there is no move in the moveHistory array, return (there is no move to undo)
    playSound("undo"); // play the undo sound
    const lastMove = moveHistory.pop(); // get the last move from the moveHistory array
    redoStack.push(lastMove); // add the last move to the redoStack array
    // Reverse the last move
    reverseMove(lastMove); // reverse the last move
    updateUI(); // update the UI
  }

  function handleRedo() {
    // function to handle the redo click
    if (redoStack.length === 0) return; // if there are no elements in the redoStack array, return (there is no move to redo)
    playSound("redo"); // play the redo sound
    const redoMove = redoStack.pop(); // get the last move from the redoStack array
    moveHistory.push(redoMove); // add the last move to the moveHistory array
    // Reapply the move
    applyMove(redoMove); // reapply the last move
    gameState.currentPlayer =
      gameState.currentPlayer === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED; // switch the current player
    updateUI(); // update the UI
  }

  function reverseMove(move) {
    // Get the node involved in the move
    const node = gameState.nodes.find((n) => n.id === move.nodeId);

    if (!node) return;

    // Handle different types of moves
    switch (move.action) {
      case "place":
        // Remove the titan
        node.occupied = null;
        node.element.classList.remove(`occupied-${move.player}`);

        // Restore titan counts
        if (move.player === PLAYER_RED) {
          gameState.redTitansPlaced--;
          gameState.redTitansRemaining++;
        } else {
          gameState.blueTitansPlaced--;
          gameState.blueTitansRemaining++;
        }
        break;

      case "move":
        // Get the source node (where the titan came from)
        const sourceNode = gameState.nodes.find((n) => n.id === move.sourceId);
        if (sourceNode) {
          // Move titan back to source
          sourceNode.occupied = move.player;
          sourceNode.element.classList.add(`occupied-${move.player}`);
          node.occupied = null;
          node.element.classList.remove(`occupied-${move.player}`);
        }
        break;
    }

    // Update edge controls after reversing the move
    updateEdgeControls();

    // Switch back to previous player
    gameState.currentPlayer = move.player;

    // Update UI
    renderGrid();
    updateUI();
  }

  function applyMove(move) {
    // Find the target node
    const node = gameState.nodes.find((n) => n.id === move.nodeId);
    if (!node) return;

    // Handle different move types
    switch (move.action) {
      case "place":
        // Place titan
        node.occupied = move.player;
        node.element.classList.add(`occupied-${move.player}`);

        // Update titan counts
        if (move.player === PLAYER_RED) {
          gameState.redTitansPlaced++;
          gameState.redTitansRemaining--;
        } else {
          gameState.blueTitansPlaced++;
          gameState.blueTitansRemaining--;
        }
        break;

      case "move":
        // Clear previous position
        if (move.fromNodeId) {
          const fromNode = gameState.nodes.find(
            (n) => n.id === move.fromNodeId
          );
          if (fromNode) {
            fromNode.occupied = null;
            fromNode.element.classList.remove(`occupied-${move.player}`);
          }
        }

        // Move to new position
        node.occupied = move.player;
        node.element.classList.add(`occupied-${move.player}`);
        break;

      case "eliminate":
        // Remove titan
        node.occupied = null;
        node.element.classList.remove(`occupied-${move.player}`);
        break;
    }

    // Update game state
    updateEdgeControls();
    checkCircuitCompletion();
    checkInnerHexagonCompletion();
    updateUI();
  }

  // Remove event listeners
  function removeEventListeners() {
    hexGrid.removeEventListener("click", handleNodeClick);
    pauseBtn.removeEventListener("click", handlePauseClick);
    resetBtn.removeEventListener("click", handleResetClick);
    undoBtn.removeEventListener("click", handleUndo);
    redoBtn.removeEventListener("click", handleRedo);
    hackerModeBtn.removeEventListener("click", enableHackerMode);
  }

  // Reset the game
  function resetGame() {
    // Remove existing event listeners
    removeEventListeners();

    // Reset game state
    gameState = {
      currentPlayer: PLAYER_RED,
      phase: "placement",
      redScore: 0,
      blueScore: 0,
      redTitansPlaced: 0,
      blueTitansPlaced: 0,
      redTitansRemaining: TOTAL_TITANS,
      blueTitansRemaining: TOTAL_TITANS,
      nodes: [],
      edges: [],
      unlockedCircuit: 1,
      gameOver: false,
      gamePaused: false,
      overallTimer: null,
      turnTimer: null,
      overallTimeRemaining: TOTAL_GAME_TIME,
      turnTimeRemaining: TURN_TIME,
      selectedNode: null,
      lastUpdateTime: Date.now(),
    };

    // Reinitialize the game
    initGame();
  }

  // Handle placement phase
  function handlePlacement(node) {
    // Check if node is already occupied
    if (node.occupied) return;

    // Place the titan
    node.occupied = gameState.currentPlayer;
    node.element.classList.add(`occupied-${gameState.currentPlayer}`);

    playSound("place");

    logMove(gameState.currentPlayer, "place", node.id);

    // Update titan counts
    if (gameState.currentPlayer === PLAYER_RED) {
      gameState.redTitansPlaced++;
      gameState.redTitansRemaining--;
    } else {
      gameState.blueTitansPlaced++;
      gameState.blueTitansRemaining--;
    }

    // Check if current circuit is full
    checkCircuitCompletion();

    // Update edge controls
    updateEdgeControls();

    // Check if all titans are placed
    if (
      (gameState.currentPlayer === PLAYER_RED &&
        gameState.redTitansPlaced === TOTAL_TITANS) ||
      (gameState.currentPlayer === PLAYER_BLUE &&
        gameState.blueTitansPlaced === TOTAL_TITANS)
    ) {
      // All titans placed, move to next phase if both players are done
      if (
        gameState.redTitansPlaced === TOTAL_TITANS &&
        gameState.blueTitansPlaced === TOTAL_TITANS
      ) {
        gameState.phase = "movement";
      }
    }

    checkTitanElimination();

    // Switch player if both have placed their titans for this circuit
    endTurn();
  }

  // Handle movement phase
  function handleMovement(node) {
    // If no node is selected, select this node if it's occupied by current player
    if (!gameState.selectedNode) {
      if (node.occupied === gameState.currentPlayer) {
        gameState.selectedNode = node;
        node.element.style.border = "2px solid white";
        return;
      }
      return;
    }

    // If the same node is clicked again, deselect it
    if (node.id === gameState.selectedNode.id) {
      gameState.selectedNode.element.style.border = "";
      gameState.selectedNode = null;
      return;
    }

    // Check if the target node is empty and adjacent to the selected node
    if (node.occupied || !areNodesAdjacent(gameState.selectedNode, node)) {
      return;
    }

    // Move the titan
    const playerColor = gameState.selectedNode.occupied;
    const fromNodeId = gameState.selectedNode.id;
    gameState.selectedNode.element.classList.remove(`occupied-${playerColor}`);
    gameState.selectedNode.element.style.border = "";
    gameState.selectedNode.occupied = null;

    node.occupied = gameState.currentPlayer;
    node.element.classList.add(`occupied-${gameState.currentPlayer}`);

    playSound("move");

    // Log the move for undo/redo functionality
    logMove(gameState.currentPlayer, "move", node.id, fromNodeId);

    // Update edge controls
    updateEdgeControls();

    // Check if current circuit is fully occupied
    checkCircuitCompletion();

    // Check if inner hexagon is fully occupied
    checkInnerHexagonCompletion();

    checkTitanElimination();

    // End turn
    gameState.selectedNode = null;
    endTurn();
  }

  // Check if two nodes are adjacent
  function areNodesAdjacent(node1, node2) {
    return gameState.edges.some(
      (edge) =>
        (edge.node1 === node1.id && edge.node2 === node2.id) ||
        (edge.node1 === node2.id && edge.node2 === node1.id)
    );
  }

  // Update edge controls based on current node occupations
  function updateEdgeControls() {
    gameState.edges.forEach((edge) => {
      const node1 = gameState.nodes.find((n) => n.id === edge.node1);
      const node2 = gameState.nodes.find((n) => n.id === edge.node2);

      if (node1.occupied && node1.occupied === node2.occupied) {
        // Both nodes are occupied by the same player
        const previousController = edge.controlledBy;
        edge.controlledBy = node1.occupied;

        // Update score if control changed
        if (previousController !== edge.controlledBy) {
          if (edge.controlledBy === PLAYER_RED) {
            gameState.redScore += edge.weight;
          } else {
            gameState.blueScore += edge.weight;
          }

          // If previous controller lost control, deduct points
          if (previousController) {
            if (previousController === PLAYER_RED) {
              gameState.redScore -= edge.weight;
            } else {
              gameState.blueScore -= edge.weight;
            }
          }
        }
      } else if (edge.controlledBy) {
        // Edge is no longer controlled
        if (edge.controlledBy === PLAYER_RED) {
          gameState.redScore -= edge.weight;
        } else {
          gameState.blueScore -= edge.weight;
        }
        edge.controlledBy = null;
      }
    });

    renderGrid();
    updateUI();
  }

  // Check if current circuit is fully occupied
  function checkCircuitCompletion() {
    // Check the currently unlocked circuit
    const circuit = gameState.unlockedCircuit;
    const circuitNodes = gameState.nodes.filter((n) => n.circuit === circuit);
    const isFull = circuitNodes.every((n) => n.occupied);

    console.log(
      `Checking circuit ${circuit}, isFull: ${isFull}, nodes: ${circuitNodes.length}`
    );

    // If this circuit is full and we can unlock the next one
    if (isFull && circuit < 3) {
      // Increment to the next circuit
      gameState.unlockedCircuit++;
      console.log(`Unlocking circuit ${gameState.unlockedCircuit}`);

      // Force re-render to update node visibility
      renderGrid();

      // Show a notification to the player
      gameStatus.textContent = `Circuit ${gameState.unlockedCircuit} unlocked!`;
      setTimeout(() => {
        updateUI(); // Reset the status message after a delay
      }, 2000);
    }
  }

  // Check if inner hexagon is fully occupied (end game condition)
  function checkInnerHexagonCompletion() {
    const innerNodes = gameState.nodes.filter((n) => n.circuit === 3);
    const isFull = innerNodes.every((n) => n.occupied);

    if (isFull) {
      endGame();
    }
  }

  // Get adjacent nodes for a given node
  function getAdjacentNodes(node) {
    const adjacentEdges = gameState.edges.filter(
      (edge) => edge.node1 === node.id || edge.node2 === node.id
    );

    return adjacentEdges.map((edge) => {
      return gameState.nodes.find(
        (n) => n.id === (edge.node1 === node.id ? edge.node2 : edge.node1)
      );
    });
  }

  // End current player's turn
  function endTurn() {
    // Reset turn timer
    gameState.turnTimeRemaining = TURN_TIME;

    // Switch player
    gameState.currentPlayer =
      gameState.currentPlayer === PLAYER_RED ? PLAYER_BLUE : PLAYER_RED;

    updateUI();
  }

  // End the game
  function endGame() {
    gameState.gameOver = true;
    clearInterval(gameState.overallTimer);
    clearInterval(gameState.turnTimer);
    
    let winner = 'draw';
    if (gameState.redScore > gameState.blueScore) {
      playSound("victory");
      winner = 'red';
    } else if (gameState.blueScore > gameState.redScore) {
      playSound("defeat");
      winner = 'blue';
    }

    // Save scores
    saveGameResult(winner);

    updateUI();
  }

  // Log a move to the history
  function logMove(player, action, nodeId) {
    const move = { player, action, nodeId };
    moveHistory.push(move);
    redoStack = []; // Clear redo stack on new move
    updateMoveHistoryDisplay();
  }

  // Update the move history display
  function updateMoveHistoryDisplay() {
    const historyList = document.getElementById("history-list");
    historyList.innerHTML = moveHistory
      .map((move) => `<li>${move.player} ${move.action} ${move.nodeId}</li>`)
      .join("");
  }

  // Titan elimination logic
  function checkTitanElimination() {
    gameState.nodes.forEach((node) => {
      const specificNodesForElimination = [
        "node-1-0",
        "node-1-2",
        "node-1-4",
        "node-2-0",
        "node-2-1",
        "node-2-2",
        "node-2-3",
        "node-2-4",
        "node-2-5",
        "node-3-1",
        "node-3-3",
        "node-3-5",
      ];
      gameState.nodes.forEach((node) => {
        if (node.occupied && isSurrounded(node) && specificNodesForElimination.includes(node.id)) {
          eliminateTitan(node);
        }
      })
    });
  }

  function isSurrounded(node) {
    const adjacentNodes = getAdjacentNodes(node);
    return (adjacentNodes.length === 3 && adjacentNodes.every(
      (adj) => adj.occupied && adj.occupied !== node.occupied
    ));
  }

  function eliminateTitan(node) {
    playSound("elimination");
    if(node.occupied){
      const eliminatedPlayer = node.occupied;
      logMove(eliminatedPlayer, "elimination", node.id);
    }
    node.occupied = null;
    node.element.classList.remove("occupied-red", "occupied-blue");
  }

  // Initialize the game
  initGame();

  window.resetGame = resetGame;
});