import React, { useState, useEffect } from "react";
import { socket } from "../../../client-socket";
import { post } from "../../../utilities";
import Board from "./Board";
import WordInput from "./WordInput";
import Counter from "./Counter";
import PointsCounter from "./PointsCounter";
import Rankings from "./Rankings";
import Log from "./Log";
import "./GameComponent.css";

const GameComponent = (props) => {
  const [word, setWord] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isTurn, setIsTurn] = useState("");
  // Game state management
  const [endPointSelected, setEndPointSelected] = useState(true);
  const [selectedX, setSelectedX] = useState(0);
  const [selectedY, setSelectedY] = useState(0);
  const [endpoints, setEndpoints] = useState([]);
  const [lettersUpdated, setLettersUpdated] = useState([]);
  const [gameState, setGameState] = useState({
    lobbyCode: "",
    username: "",
    board: [],
    points: 0,
    powerups: [],
    counter: 0,
    rankings: [],
    log: [],
  });

  //@{params} letters updated
  //@{params} board
  const updateLetters = (params) => {
    let updatedLetters = params.lettersUpdated;
    console.log("Updated letters:");
    console.log(updatedLetters);

    // Create a deep copy of the board
    let newBoard = JSON.parse(JSON.stringify(params.board));

    for (let i = 0; i < updatedLetters.length; i++) {
      let x = updatedLetters[i].x;
      let y = updatedLetters[i].y;
      let letter = updatedLetters[i].letter;
      newBoard[y][x] = {
        ...newBoard[y][x], // preserve existing tile properties
        letter: letter,
        crop: "",
        powerup: "",
        visited: true,
        default: false,
        isSuggestion: false,
        isSuggestionEnd: false,
      };
    }

    setGameState((prevState) => ({
      ...prevState,
      board: newBoard,
    }));
  };
  // Set up socket listeners
  useEffect(() => {
    // Initial game state
    const handleInitialGame = (game) => {
      setGameState(game);
      setEndpoints(game.endpoints);
    };

    // User-specific updates (letters, points, endpoints)
    const handleUserUpdate = (info) => {
      // Reset the suggestions since this only plays on user update
      setSuggestions([]);

      console.log("User update:", info);
      setGameState((prevState) => ({
        ...prevState,
        points: info.totalPoints,
      }));
      setLettersUpdated(info.letterUpdates);
      setEndpoints(info.endpoints);
    };

    // Global game updates (rankings, log messages)
    const handleGlobalUpdate = (info) => {
      console.log("Global update:", info);
      setGameState((prevState) => ({
        ...prevState,
        rankings: info.updatedRankings,
        log: [...prevState.log, ...info.logMessages],
      }));
    };

    const handleTurnUpdate = (info) => {
      if (info.userId === props.userId) {
        setIsTurn(true);
      } else {
        setIsTurn(false);
      }
    };
    // Letter updates

    const handleBoardUpdate = (info) => {
      console.log("Board update:", info);
      setLettersUpdated(info);
    };

    // Set up listeners
    socket.on("initial game", handleInitialGame);
    socket.on("user update", handleUserUpdate);
    socket.on("global update", handleGlobalUpdate);
    socket.on("turn update", handleTurnUpdate);
    socket.on("board update", handleBoardUpdate);
    // Clean up listeners on unmount

    // Cleanup listeners on unmount
    return () => {
      socket.off("initial game", handleInitialGame);
      socket.off("user update", handleUserUpdate);
      socket.off("global update", handleGlobalUpdate);
      socket.off("turn update", handleTurnUpdate);
    };
  }, []); // Empty dependency array since we want to set up listeners only once

  useEffect(() => {
    updateLetters({ lettersUpdated: lettersUpdated, board: gameState.board });
  }, [lettersUpdated]);

  // Add resize handler for board scaling
  useEffect(() => {
    const updateBoardScale = () => {
      const container = document.querySelector(".gamecompleftcontainer");
      const board = document.querySelector(".gamecompboard");
      const wordInput = document.querySelector(".gamecompwordinput");
      const counter = document.querySelector(".gamecompcounter");
      if (!container || !board || !wordInput || !counter) return;

      const containerWidth = container.clientWidth * 0.9; // 90% of container width for padding
      const boardWidth = board.scrollWidth;

      // Only scale down if board is wider than container
      const scale = boardWidth > containerWidth ? containerWidth / boardWidth : 1;
      board.style.setProperty("--board-scale", scale);

      // Position word input and counter relative to scaled board
      const scaledBoardWidth = boardWidth * scale;
      const boardRect = board.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const leftOffset = (containerRect.width - scaledBoardWidth) / 2;

      // Set word input position first
      wordInput.style.left = `${leftOffset}px`;
      wordInput.style.top = `${boardRect.bottom + 2 * scale}px`;

      // Get word input's height after positioning
      const wordInputRect = wordInput.getBoundingClientRect();

      // Align counter with word input's top edge
      counter.style.position = "absolute";
      counter.style.left = `${boardRect.right - counter.offsetWidth}px`;
      counter.style.top = `${wordInputRect.top}px`;
    };

    // Initial calculation after a short delay to ensure proper measurements
    const timeoutId = setTimeout(updateBoardScale, 0);

    // Update on window resize
    window.addEventListener("resize", updateBoardScale);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateBoardScale);
    };
  }, [gameState.board]); // Recalculate when board changes

  return (
    <div className="gamecompcontainer">
      <div className="gamecompleftcontainer">
        <div className="gamecompboardcontainer">
          <div className="gamecompboard">
            <Board
              board={gameState.board}
              points={gameState.points}
              username={gameState.username}
              endpoints={endpoints}
              endPointSelected={endPointSelected}
              setEndPointSelected={setEndPointSelected}
              selectedX={selectedX}
              selectedY={selectedY}
              setSelectedX={setSelectedX}
              setSelectedY={setSelectedY}
              lettersUpdated={lettersUpdated}
              setLettersUpdated={setLettersUpdated}
              setSuggestions={setSuggestions}
              suggestions={suggestions}
            />
          </div>
          <div className="gamecompwordinput">
            <WordInput
              word={word}
              setWord={setWord}
              selectedX={selectedX}
              selectedY={selectedY}
              endpointSelected={endPointSelected}
              lobbyCode={props.lobbyCode}
              board={gameState.board}
              suggestions={suggestions}
              isTurn={isTurn}
            />
          </div>
        </div>
        <div className="gamecompcounter">
          <Counter />
        </div>
        <div className="gamecomppoints">
          <PointsCounter points={gameState.points} />
        </div>
      </div>
      <div className="gamecomprightcontainer">
        <div className="gamecomprankings">
          <Rankings rankings={gameState.rankings} currentUserId={props.userId} />
        </div>
        <div className="gamecomplog">
          <Log log={gameState.log} />
        </div>
      </div>
    </div>
  );
};

export default GameComponent;
