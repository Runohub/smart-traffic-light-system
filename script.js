        // Simulation State
        let simulation = {
            running: false,
            interval: null,
            time: 0,
            cars: [],
            queues: {
                north: [],
                south: [],
                east: [],
                west: []
            },
            lights: {
                north: "red",
                south: "red",
                east: "red",
                west: "green"
            },
            stats: {
                totalCars: 0,
                carsProcessed: 0,
                totalWaitTime: 0,
                maxWaitTime: 0
            },
            settings: {
                nsDensity: 5,
                ewDensity: 3,
                densityThreshold: 4,
                greenDuration: 10,
                currentGreen: "west",
                greenTimer: 0,
                yellowTimer: 0
            }
        };

        // Initialize simulation
        function initSimulation() {
            updateUI();
            createInitialCars();
        }

        // Start simulation
        function startSimulation() {
            if (simulation.running) return;
            
            simulation.running = true;
            document.getElementById("startBtn").disabled = true;
            document.getElementById("pauseBtn").disabled = false;
            
            simulation.interval = setInterval(() => {
                simulation.time++;
                updateTraffic();
                spawnCars();
                moveCars();
                updateAI();
                updateUI();
            }, 1000);
        }

        // Pause simulation
        function pauseSimulation() {
            simulation.running = false;
            clearInterval(simulation.interval);
            document.getElementById("startBtn").disabled = false;
            document.getElementById("pauseBtn").disabled = true;
        }

        // Reset simulation
        function resetSimulation() {
            pauseSimulation();
            simulation = {
                running: false,
                interval: null,
                time: 0,
                cars: [],
                queues: {
                    north: [],
                    south: [],
                    east: [],
                    west: []
                },
                lights: {
                    north: "red",
                    south: "red",
                    east: "red",
                    west: "green"
                },
                stats: {
                    totalCars: 0,
                    carsProcessed: 0,
                    totalWaitTime: 0,
                    maxWaitTime: 0
                },
                settings: {
                    nsDensity: 5,
                    ewDensity: 3,
                    densityThreshold: 4,
                    greenDuration: 10,
                    currentGreen: "west",
                    greenTimer: 0,
                    yellowTimer: 0
                }
            };
            updateUI();
            createInitialCars();
        }

        // Create initial cars
        function createInitialCars() {
            const movingCars = document.getElementById("movingCars");
            movingCars.innerHTML = "";
            
            // Add some initial cars in queues
            for (let i = 0; i < 3; i++) {
                addCarToQueue("west");
                addCarToQueue("north");
            }
            for (let i = 0; i < 2; i++) {
                addCarToQueue("east");
                addCarToQueue("south");
            }
        }

        // Update traffic based on AI rules
        function updateTraffic() {
            const currentGreen = simulation.settings.currentGreen;
            simulation.settings.greenTimer++;
            
            // Check if it's time to change lights
            if (simulation.settings.greenTimer >= simulation.settings.greenDuration) {
                changeLights();
            }
            
            // Process cars in green direction
            if (simulation.lights[currentGreen] === "green") {
                processCars(currentGreen);
            }
        }

        // AI-based light changing logic
        function changeLights() {
            const current = simulation.settings.currentGreen;
            const queues = simulation.queues;
            
            // Turn current green to yellow
            simulation.lights[current] = "yellow";
            updateLightUI(current, "yellow");
            
            // AI Decision: Choose next green based on queue density
            let nextGreen = getNextGreenDirection();
            
            // After yellow period, switch to next green
            setTimeout(() => {
                simulation.lights[current] = "red";
                simulation.lights[nextGreen] = "green";
                simulation.settings.currentGreen = nextGreen;
                simulation.settings.greenTimer = 0;
                
                updateLightUI(current, "red");
                updateLightUI(nextGreen, "green");
                
                // Adjust green duration based on queue length
                const queueLength = simulation.queues[nextGreen].length;
                simulation.settings.greenDuration = Math.min(
                    30,
                    Math.max(5, 10 + Math.floor(queueLength / 2))
                );
                document.getElementById("durationValue").textContent = simulation.settings.greenDuration;
                document.getElementById("greenDuration").value = simulation.settings.greenDuration;
                
            }, 2000); // 2 second yellow light
        }

        // AI decision logic for next green direction
        function getNextGreenDirection() {
            const queues = simulation.queues;
            const current = simulation.settings.currentGreen;
            
            // Calculate queue densities
            const densities = {
                north: queues.north.length,
                south: queues.south.length,
                east: queues.east.length,
                west: queues.west.length
            };
            
            // Find direction with highest density
            let maxDensity = 0;
            let nextDirection = current;
            
            for (const [direction, density] of Object.entries(densities)) {
                if (density > maxDensity && direction !== current) {
                    maxDensity = density;
                    nextDirection = direction;
                }
            }
            
            // If no significant density, cycle through directions
            if (maxDensity < simulation.settings.densityThreshold) {
                const directions = ["north", "south", "east", "west"];
                const currentIndex = directions.indexOf(current);
                nextDirection = directions[(currentIndex + 1) % 4];
            }
            
            return nextDirection;
        }

        // Process cars in green direction
        function processCars(direction) {
            const queue = simulation.queues[direction];
            if (queue.length > 0) {
                // Remove car from queue
                const car = queue.shift();
                simulation.stats.carsProcessed++;
                simulation.stats.totalWaitTime += simulation.time - car.spawnTime;
                simulation.stats.maxWaitTime = Math.max(
                    simulation.stats.maxWaitTime,
                    simulation.time - car.spawnTime
                );
                
                // Move car through intersection
                moveCarThroughIntersection(car, direction);
            }
        }

        // Spawn new cars based on density settings
        function spawnCars() {
            // North-South traffic
            if (Math.random() < simulation.settings.nsDensity / 60) {
                addCarToQueue(Math.random() > 0.5 ? "north" : "south");
            }
            
            // East-West traffic
            if (Math.random() < simulation.settings.ewDensity / 60) {
                addCarToQueue(Math.random() > 0.5 ? "east" : "west");
            }
        }

        // Add car to queue
        function addCarToQueue(direction) {
            const car = {
                id: simulation.stats.totalCars++,
                direction: direction,
                spawnTime: simulation.time,
                color: getRandomCarColor()
            };
            
            simulation.queues[direction].push(car);
            updateQueueUI(direction);
        }

        // Move car through intersection
        function moveCarThroughIntersection(car, direction) {
            const movingCars = document.getElementById("movingCars");
            const carElement = document.createElement("div");
            carElement.className = `car bg-${car.color}-500`;
            carElement.id = `car-${car.id}`;
            
            // Position based on direction
            let startX, startY, endX, endY;
            const speed = 8; // seconds to cross
            
            switch (direction) {
                case "west":
                    startX = -30;
                    startY = "50%";
                    endX = "100%";
                    endY = "50%";
                    break;
                case "east":
                    startX = "100%";
                    startY = "50%";
                    endX = -30;
                    endY = "50%";
                    break;
                case "north":
                    startX = "50%";
                    startY = -15;
                    endX = "50%";
                    endY = "100%";
                    break;
                case "south":
                    startX = "50%";
                    startY = "100%";
                    endX = "50%";
                    endY = -15;
                    break;
            }
            
            carElement.style.left = startX;
            carElement.style.top = startY;
            carElement.style.transform = `translate(-50%, -50%)`;
            
            movingCars.appendChild(carElement);
            
            // Animate car movement
            setTimeout(() => {
                carElement.style.transition = `left ${speed}s linear, top ${speed}s linear`;
                carElement.style.left = endX;
                carElement.style.top = endY;
                
                // Remove car after animation
                setTimeout(() => {
                    if (carElement.parentNode) {
                        carElement.parentNode.removeChild(carElement);
                    }
                }, speed * 1000);
            }, 100);
        }

        // Move waiting cars
        function moveCars() {
            // Update queue positions
            for (const direction of ["north", "south", "east", "west"]) {
                updateQueueUI(direction);
            }
        }

        // Update AI decision making
        function updateAI() {
            const decisionDiv = document.getElementById("decisionLogic");
            const queues = simulation.queues;
            
            let decisionText = "<p class='mb-2 font-semibold text-green-400'>AI Decision Process:</p>";
            decisionText += "<div class='bg-gray-800 rounded p-3'>";
            
            // Calculate densities
            const densities = Object.entries(queues).map(([dir, cars]) => ({
                direction: dir,
                count: cars.length
            })).sort((a, b) => b.count - a.count);
            
            densities.forEach(item => {
                const isGreen = simulation.lights[item.direction] === "green";
                const color = isGreen ? "text-green-400" : "text-gray-300";
                decisionText += `<div class="flex justify-between ${color} mb-1">
                    <span>${item.direction.charAt(0).toUpperCase() + item.direction.slice(1)}:</span>
                    <span class="font-semibold">${item.count} cars</span>
                </div>`;
            });
            
            decisionText += `</div><p class="mt-2 text-sm text-yellow-300">Next change in: ${simulation.settings.greenDuration - simulation.settings.greenTimer}s</p>`;
            
            decisionDiv.innerHTML = decisionText;
        }

        // Update UI
        function updateUI() {
            // Update queue counts
            document.getElementById("westCount").textContent = simulation.queues.west.length;
            document.getElementById("eastCount").textContent = simulation.queues.east.length;
            document.getElementById("northCount").textContent = simulation.queues.north.length;
            document.getElementById("southCount").textContent = simulation.queues.south.length;
            
            // Update statistics
            const avgWait = simulation.stats.carsProcessed > 0 
                ? Math.floor(simulation.stats.totalWaitTime / simulation.stats.carsProcessed)
                : 0;
            
            document.getElementById("avgWaitTime").textContent = `${avgWait}s`;
            document.getElementById("carsProcessed").textContent = simulation.stats.carsProcessed;
            document.getElementById("totalCars").textContent = simulation.stats.totalCars;
            document.getElementById("carsThrough").textContent = simulation.stats.carsProcessed;
            document.getElementById("maxWait").textContent = simulation.stats.maxWaitTime;
            
            // Update progress bars
            const waitTimePercent = Math.min(100, avgWait * 5);
            document.getElementById("waitTimeBar").style.width = `${waitTimePercent}%`;
            
            const processedPercent = Math.min(100, simulation.stats.carsProcessed * 2);
            document.getElementById("processedBar").style.width = `${processedPercent}%`;
            
            // Calculate efficiency score
            const efficiency = Math.min(100, 
                100 - (avgWait * 2) + (simulation.stats.carsProcessed * 0.5)
            );
            document.getElementById("efficiencyScore").textContent = `${Math.max(0, Math.floor(efficiency))}%`;
            document.getElementById("efficiencyBar").style.width = `${Math.max(0, Math.floor(efficiency))}%`;
            
            // Update average speed (simulated)
            const avgSpeed = 30 + Math.floor(Math.random() * 20);
            document.getElementById("avgSpeed").textContent = avgSpeed;
        }

        // Update queue UI
        function updateQueueUI(direction) {
            const queueDiv = document.getElementById(`${direction}Queue`);
            const cars = simulation.queues[direction];
            
            // Clear existing cars
            queueDiv.innerHTML = "";
            
            // Add cars to queue
            cars.forEach((car, index) => {
                const carElement = document.createElement("div");
                carElement.className = `queue-car bg-${car.color}-500`;
                carElement.style.margin = "1px";
                carElement.title = `Waiting: ${simulation.time - car.spawnTime}s`;
                queueDiv.appendChild(carElement);
            });
        }

        // Update light UI
        function updateLightUI(direction, color) {
            const lightDiv = document.getElementById(`${direction}Light`);
            const lights = lightDiv.querySelectorAll(".light");
            
            lights.forEach(light => {
                light.classList.remove("active");
            });
            
            if (color === "red") {
                lights[0].classList.add("active");
            } else if (color === "yellow") {
                lights[1].classList.add("active");
            } else if (color === "green") {
                lights[2].classList.add("active");
            }
        }

        // Get random car color
        function getRandomCarColor() {
            const colors = ["blue", "red", "green", "yellow"];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        // Update density settings
        function updateDensity(type, value) {
            if (type === "ns") {
                simulation.settings.nsDensity = parseInt(value);
                document.getElementById("nsDensityValue").textContent = value;
            } else {
                simulation.settings.ewDensity = parseInt(value);
                document.getElementById("ewDensityValue").textContent = value;
            }
        }

        // Update threshold
        function updateThreshold(value) {
            simulation.settings.densityThreshold = parseInt(value);
            document.getElementById("thresholdValue").textContent = value;
        }

        // Update duration
        function updateDuration(value) {
            simulation.settings.greenDuration = parseInt(value);
            document.getElementById("durationValue").textContent = value;
        }

        // Show section
        function showSection(sectionId) {
            // Hide all sections
            document.getElementById("simulation").classList.add("hidden");
            document.getElementById("rules").classList.add("hidden");
            document.getElementById("stats").classList.add("hidden");
            
            // Show selected section
            document.getElementById(sectionId).classList.remove("hidden");
            
            // Update navigation
            const navLinks = document.querySelectorAll("nav a");
            navLinks.forEach(link => {
                link.classList.remove("text-blue-400");
                link.classList.add("text-gray-400");
            });
            
            // Highlight current section
            const currentLink = Array.from(navLinks).find(link => 
                link.getAttribute("onclick")?.includes(sectionId)
            );
            if (currentLink) {
                currentLink.classList.remove("text-gray-400");
                currentLink.classList.add("text-blue-400");
            }
        }

        // Initialize on load
        document.addEventListener("DOMContentLoaded", () => {
            initSimulation();
            showSection("simulation");
        });
