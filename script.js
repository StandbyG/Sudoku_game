document.addEventListener('DOMContentLoaded', () => {
    const boardElement = document.getElementById('board');
    const numberButtons = document.querySelectorAll('.number');
    const easyBtn = document.getElementById('easy-btn');
    const mediumBtn = document.getElementById('medium-btn');
    const hardBtn = document.getElementById('hard-btn');
    const newGameBtn = document.getElementById('new-game-btn');
    const messageArea = document.getElementById('message-area');

    let board = [];
    let selectedCell = null;
    let originalBoard = [];

    // Lógica para generar el tablero de Sudoku completo y válido
    function generateSolvedSudoku() {
        const newBoard = Array(9).fill(null).map(() => Array(9).fill(0));
        solveSudoku(newBoard);
        return newBoard;
    }

    // Algoritmo de backtracking para resolver un tablero
    function solveSudoku(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    for (const num of numbers) {
                        if (isValid(board, row, col, num)) {
                            board[row][col] = num;
                            if (solveSudoku(board)) {
                                return true;
                            }
                            board[row][col] = 0; // Backtrack
                        }
                    }
                    return false;
                }
            }
        }
        return true;
    }

    // Verifica si un número es válido en una posición
    function isValid(board, row, col, num) {
        for (let i = 0; i < 9; i++) {
            if (board[row][i] === num || board[i][col] === num) {
                return false;
            }
        }
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }
        return true;
    }

    // Mezcla un array (para generar tableros únicos)
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Crea el tablero para la interfaz de usuario
    function createBoard(difficulty) {
        boardElement.innerHTML = '';
        originalBoard = generateSolvedSudoku();
        board = JSON.parse(JSON.stringify(originalBoard)); // Clona el tablero

        let cellsToRemove;
        switch (difficulty) {
            case 'easy':
                cellsToRemove = 35;
                break;
            case 'medium':
                cellsToRemove = 45;
                break;
            case 'hard':
                cellsToRemove = 55;
                break;
            default:
                cellsToRemove = 40;
        }

        // Remueve celdas para crear la dificultad
        for (let i = 0; i < cellsToRemove; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * 9);
                col = Math.floor(Math.random() * 9);
            } while (board[row][col] === 0);
            board[row][col] = 0;
        }

        renderBoard();
        messageArea.textContent = '';
    }

    // Dibuja el tablero en la interfaz
    function renderBoard() {
        boardElement.innerHTML = '';
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                if (board[r][c] !== 0) {
                    cell.textContent = board[r][c];
                    cell.classList.add('fixed');
                }
                cell.addEventListener('click', selectCell);
                boardElement.appendChild(cell);
            }
        }
    }

    // Maneja la selección de celdas
    function selectCell(event) {
        if (selectedCell) {
            selectedCell.classList.remove('selected');
            selectedCell.classList.remove('error');
            clearHighlights();
        }
        selectedCell = event.target;
        if (!selectedCell.classList.contains('fixed')) {
            selectedCell.classList.add('selected');
            highlightRelatedCells(selectedCell.dataset.row, selectedCell.dataset.col);
        }
    }
    
    // Función para resaltar celdas relacionadas (fila, columna y subcuadrícula)
    function highlightRelatedCells(row, col) {
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (r == row || c == col || (Math.floor(r / 3) * 3 == startRow && Math.floor(c / 3) * 3 == startCol)) {
                    document.querySelector(`[data-row='${r}'][data-col='${c}']`).classList.add('highlight');
                }
            }
        }
    }

    // Limpia los resaltados
    function clearHighlights() {
        document.querySelectorAll('.cell').forEach(cell => cell.classList.remove('highlight'));
    }

    // Maneja la entrada de números
    numberButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (selectedCell && !selectedCell.classList.contains('fixed')) {
                const row = parseInt(selectedCell.dataset.row);
                const col = parseInt(selectedCell.dataset.col);
                const num = parseInt(button.textContent);
                
                selectedCell.textContent = num;
                board[row][col] = num;
                
                const isValidMove = (num === originalBoard[row][col]);
                if (!isValidMove) {
                    selectedCell.classList.add('error');
                    messageArea.textContent = '¡Número incorrecto!';
                    messageArea.classList.remove('message-success');
                    messageArea.classList.add('message-error');
                } else {
                    selectedCell.classList.remove('error');
                    messageArea.textContent = '';
                    if (isSolved()) {
                        messageArea.textContent = '¡Felicidades, has resuelto el Sudoku! 🎉';
                        messageArea.classList.remove('message-error');
                        messageArea.classList.add('message-success');
                    } else {
                        // Comprobar si una subcuadrícula se ha completado correctamente
                        checkSubgridCompletion();
                    }
                }
            }
        });
    });

    // Nueva función para verificar si una subcuadrícula está completa y correcta
    function checkSubgridCompletion() {
        for (let startRow = 0; startRow < 9; startRow += 3) {
            for (let startCol = 0; startCol < 9; startCol += 3) {
                let isComplete = true;
                let isCorrect = true;
                for (let r = 0; r < 3; r++) {
                    for (let c = 0; c < 3; c++) {
                        const cellValue = board[startRow + r][startCol + c];
                        if (cellValue === 0) {
                            isComplete = false;
                            break;
                        }
                        if (cellValue !== originalBoard[startRow + r][startCol + c]) {
                            isCorrect = false;
                        }
                    }
                    if (!isComplete) break;
                }
                
                if (isComplete && isCorrect) {
                    messageArea.textContent = '¡Has completado una subcuadrícula correctamente! ✅';
                    messageArea.classList.remove('message-error');
                    messageArea.classList.add('message-success');
                }
            }
        }
    }


    // Revisa si el tablero está resuelto
    function isSolved() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0 || board[r][c] !== originalBoard[r][c]) {
                    return false;
                }
            }
        }
        return true;
    }

    // Eventos para los botones de dificultad
    easyBtn.addEventListener('click', () => createBoard('easy'));
    mediumBtn.addEventListener('click', () => createBoard('medium'));
    hardBtn.addEventListener('click', () => createBoard('hard'));
    newGameBtn.addEventListener('click', () => createBoard('easy'));

    // Iniciar el juego con dificultad fácil por defecto
    createBoard('easy');
});