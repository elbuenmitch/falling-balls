// Matter.js module aliases
const { Engine, Render, Runner, Bodies, Composite, Events, Body } = Matter;

// Game variables
let engine, render, runner;
let balls = [];
let selectedBall = null;
let gameStarted = false;
let gameFinished = false;
let obstacles = [];
let originalBallColors = [];
let obstacleSpeed = 2; // Default movement speed
let jumpForce = 0.15; // Default jump force

// Default settings that will be saved/loaded from the database
const defaultSettings = {
    ballCount: 20,
    ballRadius: 20,
    obstacleCount: 20,
    maxSize: 1.5,
    movementSpeed: 2,
    jumpForce: 0.15
};

// Current settings - initialized with defaults
let currentSettings = { ...defaultSettings };

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const updateCanvasSize = () => {
    canvas.width = window.innerWidth - 40;
    canvas.height = window.innerHeight - 200;
};
updateCanvasSize();

// Update canvas size when window is resized
window.addEventListener('resize', () => {
    updateCanvasSize();
    if (render) {
        render.canvas.width = canvas.width;
        render.canvas.height = canvas.height;
    }
});

// Initialize game engine
function initGame() {
    // Create engine
    engine = Engine.create();
    
    // Create renderer
    render = Render.create({
        canvas: canvas,
        engine: engine,
        options: {
            width: canvas.width,
            height: canvas.height,
            wireframes: false,
            background: '#404040',
            showDebug: false,
            showBounds: false,
            showVelocity: false,
            showCollisions: false,
            showSeparations: false,
            showAxes: false,
            showPositions: false,
            showAngleIndicator: false,
            showIds: false,
            showShadows: false,
            showVertexNumbers: false,
            showConvexHulls: false,
            showInternalEdges: false
        }
    });



    // Create runner
    runner = Runner.create();

    // Create walls - using canvas dimensions for proper scaling
    const walls = [
        Bodies.rectangle(canvas.width/2, canvas.height + 10, canvas.width, 20, { 
            isStatic: true,
            render: { fillStyle: '#1a1a1a' }
        }), // bottom
        Bodies.rectangle(-10, canvas.height/2, 20, canvas.height, { 
            isStatic: true,
            render: { fillStyle: '#1a1a1a' }
        }), // left
        Bodies.rectangle(canvas.width + 10, canvas.height/2, 20, canvas.height, { 
            isStatic: true,
            render: { fillStyle: '#1a1a1a' }
        }), // right
        Bodies.rectangle(canvas.width/2, -10, canvas.width, 20, { 
            isStatic: true,
            render: { fillStyle: '#1a1a1a' }
        }), // ceiling
    ];

    // Add walls to the world
    Composite.add(engine.world, walls);

    // Modify engine to handle ignoreGravity property
    Events.on(engine, 'beforeUpdate', () => {
        const bodies = Composite.allBodies(engine.world);
        bodies.forEach(body => {
            if (body.ignoreGravity) {
                // Reset gravity effect
                body.force.x = 0;
                body.force.y = 0;
            }
        });
    });

    // Start the renderer
    Render.run(render);
}

// Utility function to get random number between min and max
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// Create random obstacle
function createRandomObstacle(x, y, maxSize) {
    const sizeMultiplier = random(0.5, maxSize);
    const shapes = [
        () => Bodies.polygon(x, y, 3, random(30, 50) * sizeMultiplier, { // Triangle
            isStatic: false,
            angle: random(0, Math.PI),
            render: { fillStyle: '#888888' },
            density: 0.1,
            frictionAir: 0,
            restitution: 0.8,
            friction: 0.1,
            ignoreGravity: true
        }),
        () => Bodies.rectangle(x, y, random(80, 200) * sizeMultiplier, random(20, 30) * sizeMultiplier, { // Rectangle
            isStatic: false,
            angle: random(-Math.PI/3, Math.PI/3),
            render: { fillStyle: '#888888' },
            density: 0.1,
            frictionAir: 0,
            restitution: 0.8,
            friction: 0.1,
            ignoreGravity: true
        }),
        () => Bodies.circle(x, y, random(20, 35) * sizeMultiplier, { // Circle
            isStatic: false,
            render: { fillStyle: '#888888' },
            density: 0.1,
            frictionAir: 0,
            restitution: 0.8,
            friction: 0.1,
            ignoreGravity: true
        }),
        () => Bodies.polygon(x, y, 4, random(30, 50) * sizeMultiplier, { // Square
            isStatic: false,
            angle: random(0, Math.PI/4),
            render: { fillStyle: '#888888' },
            density: 0.1,
            frictionAir: 0,
            restitution: 0.8,
            friction: 0.1,
            ignoreGravity: true
        }),
        () => Bodies.polygon(x, y, 6, random(25, 40) * sizeMultiplier, { // Hexagon
            isStatic: false,
            angle: random(0, Math.PI/6),
            render: { fillStyle: '#888888' },
            density: 0.1,
            frictionAir: 0,
            restitution: 0.8,
            friction: 0.1,
            ignoreGravity: true
        })
    ];
    
    return shapes[Math.floor(random(0, shapes.length))]();
}

// Create randomized obstacles
function createObstacles(count, maxSize) {
    const obstacles = [];
    const segmentHeight = (canvas.height - 150) / 3;

    for (let i = 0; i < count; i++) {
        const x = random(150, canvas.width - 150);
        const y = random(200, canvas.height - 150);
        const obstacle = createRandomObstacle(x, y, maxSize);
        
        // Store original position for movement range
        obstacle.originalPosition = { x, y };
        obstacles.push(obstacle);
    }

    return obstacles;
}

// Create balls based on user input
function createBalls(count, radius) {
    const colors = ['#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#88ff00', '#0088ff', '#ff0088'];
    balls = [];
    originalBallColors = [];

    // Calculate available width for ball placement
    const margin = radius * 3;
    const availableWidth = canvas.width - (margin * 2);
    const positions = [];

    // Create evenly spaced initial positions and then shuffle them
    const spacing = availableWidth / (count + 1);
    for (let i = 1; i <= count; i++) {
        positions.push(margin + spacing * i);
    }
    
    // Fisher-Yates shuffle
    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (let i = 0; i < count; i++) {
        const color = colors[i % colors.length];
        const x = positions[i];

        const ball = Bodies.circle(x, 50, radius, {
            restitution: 0.6,
            friction: 0.1,
            render: {
                fillStyle: color,
                lineWidth: 0
            },
            ballId: i + 1 // Add ball ID
        });

        balls.push(ball);
        originalBallColors.push(color);
    }

    return balls;
}

// Setup and ball selection handler
// Update jump force when input changes
document.getElementById('jumpForce').addEventListener('change', (e) => {
    jumpForce = parseFloat(e.target.value);
    currentSettings.jumpForce = jumpForce;
});

// Function to get current settings from the UI
function getCurrentSettingsFromUI() {
    return {
        ballCount: parseInt(document.getElementById('ballCount').value),
        ballRadius: parseInt(document.getElementById('ballRadius').value),
        obstacleCount: parseInt(document.getElementById('obstacleCount').value),
        maxSize: parseFloat(document.getElementById('maxSize').value),
        movementSpeed: parseFloat(document.getElementById('movementRange').value),
        jumpForce: parseFloat(document.getElementById('jumpForce').value)
    };
}

// Function to update the UI with settings
function updateUIWithSettings(settings) {
    document.getElementById('ballCount').value = settings.ballCount;
    document.getElementById('ballRadius').value = settings.ballRadius;
    document.getElementById('obstacleCount').value = settings.obstacleCount;
    document.getElementById('maxSize').value = settings.maxSize;
    document.getElementById('movementRange').value = settings.movementSpeed;
    document.getElementById('jumpForce').value = settings.jumpForce;
    
    // Update game variables
    jumpForce = settings.jumpForce;
    obstacleSpeed = settings.movementSpeed;
}

// Save settings to database
async function saveSettings() {
    currentSettings = getCurrentSettingsFromUI();
    if (window.dbService) {
        try {
            await window.dbService.saveSettings(currentSettings);
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    } else {
        console.warn('Database service not available');
    }
}

// Load settings from database
async function loadSettings() {
    if (window.dbService) {
        try {
            const savedSettings = await window.dbService.loadSettings();
            if (savedSettings) {
                currentSettings = {
                    ballCount: savedSettings.ball_count,
                    ballRadius: savedSettings.ball_radius,
                    obstacleCount: savedSettings.obstacle_count,
                    maxSize: savedSettings.max_size,
                    movementSpeed: savedSettings.movement_speed,
                    jumpForce: savedSettings.jump_force
                };
                updateUIWithSettings(currentSettings);
                console.log('Settings loaded successfully:', currentSettings);
            } else {
                // If no settings found, use defaults
                currentSettings = { ...defaultSettings };
                updateUIWithSettings(currentSettings);
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Use defaults on error
            currentSettings = { ...defaultSettings };
            updateUIWithSettings(currentSettings);
        }
    } else {
        console.warn('Database service not available');
    }
}

// Load settings when the page loads
window.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    initGame();
});

document.getElementById('startGame').addEventListener('click', async () => {
    // Save current settings before starting the game
    await saveSettings();
    
    if (gameStarted || gameFinished) {
        // Remove winner label if it exists
        const winnerLabel = document.querySelector('.winner-label');
        if (winnerLabel) {
            winnerLabel.remove();
        }
        location.reload(); // Reset game
        return;
    }

    const ballCount = parseInt(document.getElementById('ballCount').value);
    const ballRadius = parseInt(document.getElementById('ballRadius').value);

    if (ballCount < 2 || ballCount > 30) {
        alert('Please enter a number of balls between 2 and 30');
        return;
    }

    if (ballRadius < 10 || ballRadius > 40) {
        alert('Please enter a ball radius between 10 and 40 pixels');
        return;
    }

    const obstacleCount = parseInt(document.getElementById('obstacleCount').value);
    const maxSize = parseFloat(document.getElementById('maxSize').value);
    const movementRange = parseFloat(document.getElementById('movementRange').value);
    
    if (obstacleCount < 3) {
        alert('Please enter at least 3 obstacles');
        return;
    }
    
    if (maxSize < 0.1) {
        alert('Please enter a positive maximum size (minimum 0.1)');
        return;
    }
    
    if (movementRange < 0) {
        alert('Please enter a positive movement speed');
        return;
    }
    
    obstacleSpeed = movementRange;

    // Initialize the game
    initGame();
    
    // Create and add balls
    const newBalls = createBalls(ballCount, ballRadius);
    
    // Create and add obstacles
    obstacles = createObstacles(obstacleCount, maxSize);
    
    // Give initial random velocities to obstacles
    obstacles.forEach(obstacle => {
        const angle = random(0, Math.PI * 2);
        const speed = obstacleSpeed;
        Body.setVelocity(obstacle, {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        });
    });
    
    Composite.add(engine.world, [...newBalls, ...obstacles]);

    // Start the renderer but not the physics yet
    Render.run(render);

    document.getElementById('startGame').textContent = 'Reset Game';
    document.getElementById('gameStatus').textContent = 'Click a ball to start!';

    // Add click handler for ball selection
    render.canvas.addEventListener('click', (event) => {
        if (selectedBall || gameStarted || gameFinished) return;

        const rect = canvas.getBoundingClientRect();
        // Scale the click coordinates to match the canvas coordinate system
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        balls.forEach((ball, index) => {
            const dx = ball.position.x - x;
            const dy = ball.position.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < ballRadius * 1.5) {
                selectedBall = ball;
                // Keep original color but add a white border
                ball.render.lineWidth = 8;
                ball.render.strokeStyle = '#ffffff';
                gameStarted = true;
                
                // Apply random upward forces to all balls
                balls.forEach(ball => {
                    const upwardForce = random(-0.05, -0.08) * jumpForce; // Apply jump force multiplier
                    const horizontalForce = random(-0.03, 0.03); // Horizontal force remains the same
                    
                    Body.applyForce(ball, ball.position, {
                        x: horizontalForce,
                        y: upwardForce
                    });
                });
                
                // Also apply a small random rotation
                balls.forEach(ball => {
                    Body.setAngularVelocity(ball, random(-0.1, 0.1));
                });
                
                // Start the physics simulation only after ball selection
                Runner.run(runner, engine);
                document.getElementById('gameStatus').textContent = 'Game Started! Watch your ball!';
            }
        });
    });

    // Update obstacle positions and check for winner
    Events.on(engine, 'afterUpdate', () => {
        // Keep obstacles moving at constant speed and direction
        if (gameStarted && !gameFinished) {
            obstacles.forEach(obstacle => {
                if (!obstacle.initialDirection) {
                    // Set initial random direction when game starts
                    const randomAngle = random(0, Math.PI * 2);
                    const randomSpeed = random(0.5, 1.5) * obstacleSpeed;
                    obstacle.initialDirection = {
                        x: Math.cos(randomAngle) * randomSpeed,
                        y: Math.sin(randomAngle) * randomSpeed
                    };
                }

                // Keep obstacle within bounds
                if (obstacle.position.x < 0 || obstacle.position.x > canvas.width) {
                    obstacle.initialDirection.x *= -1;
                }
                if (obstacle.position.y < 0 || obstacle.position.y > canvas.height) {
                    obstacle.initialDirection.y *= -1;
                }
                
                // Maintain constant velocity
                Body.setVelocity(obstacle, obstacle.initialDirection);
            });

            // Update winner label if it exists
            const winnerLabel = document.querySelector('.winner-label');
            if (winnerLabel && winnerLabel.ball) {
                winnerLabel.style.left = `${winnerLabel.ball.position.x}px`;
                winnerLabel.style.top = `${winnerLabel.ball.position.y - 30}px`;
            }
        }
        
        if (!gameStarted || !selectedBall) return;

        balls.forEach(ball => {
            if (ball.position.y > canvas.height*0.95) {
                gameStarted = false;
                gameFinished = true;
                Runner.stop(runner);

                const isWinner = ball === selectedBall;

                document.getElementById('gameStatus').textContent = 
                    isWinner ? 
                        'Congratulations! Your ball won!' : 
                        'Game Over - Try Again!';
                document.getElementById('gameStatus').style.color = 
                    isWinner ? '#00ff00' : '#ffffff';

                // Create winner label
                const winnerLabel = document.createElement('div');
                winnerLabel.className = 'winner-label';
                winnerLabel.textContent = 'WINNER!';
                winnerLabel.style.position = 'absolute';
                winnerLabel.style.left = `${ball.position.x}px`;
                winnerLabel.style.top = `${ball.position.y - 30}px`;
                winnerLabel.ball = ball; // Store reference to the ball
                document.querySelector('.game-container').appendChild(winnerLabel);
            }
        });
    });
});
