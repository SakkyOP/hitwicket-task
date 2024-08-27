/* eslint-disable react/prop-types */
import { useState } from "react";
import "../styles/Gameboard.css";

// Piece component to display different pieces
const Piece = ({ type, player, onClick }) => {
	return (
		<div className={`piece ${player}-${type}`} onClick={onClick}>
			{type}
		</div>
	);
};

// Cell component to represent each cell in the grid
const Cell = ({ piece, onClick, isHighlighted }) => {
	return (
		<div
			className={`cell ${isHighlighted ? "highlighted" : ""}`}
			onClick={onClick}>
			{piece ? <Piece type={piece.type} player={piece.player} /> : null}
		</div>
	);
};

// BoardCreation component for setting up the board before starting the game
const BoardCreation = ({ onStartGame }) => {
	const initialGrid = Array(5)
		.fill(null)
		.map(() => Array(5).fill(null));
	const [grid, setGrid] = useState(initialGrid);
	const [selectedPiece, setSelectedPiece] = useState(null);

	const availablePiecesA = [
		{ type: "P1", player: "A" },
		{ type: "P2", player: "A" },
		{ type: "P3", player: "A" }, // New Pawn
		{ type: "H1", player: "A" },
		{ type: "H2", player: "A" },
	];

	const availablePiecesB = [
		{ type: "P1", player: "B" },
		{ type: "P2", player: "B" },
		{ type: "P3", player: "B" }, // New Pawn
		{ type: "H1", player: "B" },
		{ type: "H2", player: "B" },
	];

	const selectPiece = (piece) => {
		setSelectedPiece(piece);
	};

	const placePiece = (x, y) => {
		if (selectedPiece && !grid[x][y]) {
			const newGrid = [...grid];
			newGrid[x][y] = selectedPiece;
			setGrid(newGrid);
			setSelectedPiece(null);
		}
	};

	const handleStartGame = () => {
		onStartGame(grid);
	};

	return (
		<div className="board-creation">
			<div className="available-pieces">
				{availablePiecesA.map((piece, index) => (
					<Piece
						key={index}
						type={piece.type}
						player={piece.player}
						onClick={() => selectPiece(piece)}
					/>
				))}
				{availablePiecesB.map((piece, index) => (
					<Piece
						key={index}
						type={piece.type}
						player={piece.player}
						onClick={() => selectPiece(piece)}
					/>
				))}
			</div>
			<div className="board">
				{grid.map((row, rowIndex) =>
					row.map((cell, cellIndex) => (
						<Cell
							key={`${rowIndex}-${cellIndex}`}
							piece={cell}
							onClick={() => placePiece(rowIndex, cellIndex)}
						/>
					))
				)}
			</div>
			<button onClick={handleStartGame}>Start Game</button>
		</div>
	);
};

// GameBoard component to render the grid and handle game state
const GameBoard = ({ initialGrid }) => {
	const [grid, setGrid] = useState(initialGrid);
	const [selectedPiece, setSelectedPiece] = useState(null);
	const [highlightedCells, setHighlightedCells] = useState([]);
	const [moveHistory, setMoveHistory] = useState([]);

	const selectPiece = (x, y) => {
		const piece = grid[x][y];
		if (piece && piece.player === "A") {
			// Only allow Player A's pieces to be selected
			setSelectedPiece({ ...piece, x, y });
			highlightPossibleMoves(piece, x, y);
		} else {
			setSelectedPiece(null);
			setHighlightedCells([]);
		}
	};

	const highlightPossibleMoves = (piece, x, y) => {
		const moves = [];
		switch (piece.type) {
			case "P1":
			case "P2":
			case "P3":
				moves.push([x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]);
				break;
			case "H1":
				moves.push([x - 2, y], [x + 2, y], [x, y - 2], [x, y + 2]);
				break;
			case "H2":
				moves.push(
					[x - 2, y - 2],
					[x - 2, y + 2],
					[x + 2, y - 2],
					[x + 2, y + 2]
				);
				break;
			default:
				return;
		}

		const validMoves = moves.filter(
			([newX, newY]) =>
				newX >= 0 &&
				newX < 5 &&
				newY >= 0 &&
				newY < 5 &&
				(!grid[newX][newY] || grid[newX][newY].player !== piece.player)
		);

		setHighlightedCells(validMoves);
	};

	const movePiece = (x, y) => {
		if (
			selectedPiece &&
			highlightedCells.some(([hx, hy]) => hx === x && hy === y)
		) {
			const newGrid = [...grid];
			const { x: oldX, y: oldY } = selectedPiece;

			// Check for Hero piece killing
			if (selectedPiece.type.startsWith("H")) {
				if (!validateAndKillEnemies(selectedPiece, oldX, oldY, x, y)) {
					return; // Invalid move due to ally in the path
				}
			}

			newGrid[oldX][oldY] = null;
			newGrid[x][y] = {
				player: selectedPiece.player,
				type: selectedPiece.type,
			};
			setGrid(newGrid);

			// Add move to history
			const moveDirection = getMoveDirection(
				selectedPiece.type,
				oldX,
				oldY,
				x,
				y
			);
			setMoveHistory([
				...moveHistory,
				`${selectedPiece.type}:${moveDirection}`,
			]);

			setSelectedPiece(null);
			setHighlightedCells([]);
		}
	};

	const validateAndKillEnemies = (piece, oldX, oldY, newX, newY) => {
		const path = [];

		if (piece.type === "H1") {
			// Hero1 moves straight
			if (oldX === newX) {
				const start = Math.min(oldY, newY) + 1;
				const end = Math.max(oldY, newY);
				for (let i = start; i < end; i++) {
					path.push([oldX, i]);
				}
			} else if (oldY === newY) {
				const start = Math.min(oldX, newX) + 1;
				const end = Math.max(oldX, newX);
				for (let i = start; i < end; i++) {
					path.push([i, oldY]);
				}
			}
		} else if (piece.type === "H2") {
			// Hero2 moves diagonally
			if (Math.abs(newX - oldX) === 2 && Math.abs(newY - oldY) === 2) {
				path.push([(oldX + newX) / 2, (oldY + newY) / 2]);
			}
		}

		for (const [px, py] of path) {
			if (grid[px][py]) {
				if (grid[px][py].player === piece.player) {
					return false; // Invalid move, ally in path
				}
				grid[px][py] = null; // Kill enemy piece
			}
		}

		return true;
	};

	const getMoveDirection = (type, oldX, oldY, newX, newY) => {
		if (type.startsWith("P") || type === "H1") {
			if (newX < oldX) return "F";
			if (newX > oldX) return "B";
			if (newY < oldY) return "L";
			if (newY > oldY) return "R";
		} else if (type === "H2") {
			if (newX < oldX && newY < oldY) return "FL";
			if (newX < oldX && newY > oldY) return "FR";
			if (newX > oldX && newY < oldY) return "BL";
			if (newX > oldX && newY > oldY) return "BR";
		}
		return "";
	};

	return (
		<div>
			<div className="board">
				{grid.map((row, rowIndex) =>
					row.map((cell, cellIndex) => (
						<Cell
							key={`${rowIndex}-${cellIndex}`}
							piece={cell}
							isHighlighted={highlightedCells.some(
								([hx, hy]) =>
									hx === rowIndex && hy === cellIndex
							)}
							onClick={() =>
								cell
									? selectPiece(rowIndex, cellIndex)
									: movePiece(rowIndex, cellIndex)
							}
						/>
					))
				)}
				<div className="move-history">
					<h3>Move History</h3>
					<ul>
						{moveHistory.map((move, index) => (
							<li key={index}>{move}</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
};

// Main component to handle game flow
const GameApp = () => {
	const [isGameStarted, setIsGameStarted] = useState(false);
	const [initialGrid, setInitialGrid] = useState(null);

	const startGame = (grid) => {
		setInitialGrid(grid);
		setIsGameStarted(true);
	};

	return (
		<div>
			{isGameStarted ? (
				<GameBoard initialGrid={initialGrid} />
			) : (
				<BoardCreation onStartGame={startGame} />
			)}
		</div>
	);
};

export default GameApp;
