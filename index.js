export const generateCanvas = ({ width, height, attachNode }) => {
    const element = document.createElement("canvas");
    const context = element.getContext("2d");
  
    element.style.width = width + "px";
    element.style.height = height + "px";
  
    const scale = window.devicePixelRatio;
    element.width = Math.floor(width * scale);
    element.height = Math.floor(height * scale);
    context.scale(scale, scale);
  
    document.querySelector(attachNode).appendChild(element);
  
    return [context, width, height, element];
  };
  
  export const animate = (drawFunc) => {
    let previousTimestamp = false;
  
    const drawFuncContainer = (timestamp) => {
      const deltaTime = previousTimestamp
        ? timestamp - previousTimestamp
        : performance.now() - timestamp;
      drawFunc(deltaTime);
      window.requestAnimationFrame(drawFuncContainer);
      previousTimestamp = timestamp;
    };
  
    window.requestAnimationFrame(drawFuncContainer);
  };
  
  export const randomBetween = (min, max) => Math.random() * (max - min) + min;
  
  const pink = "#e79fae";
  const red = "#da4b34";
  const yellow = "#f5c347";
  const turquoise = "#8bcbf3";
  const white = "#fbfbf8";
  
  const [CTX, canvasWidth, canvasHeight] = generateCanvas({
    width: window.innerWidth,
    height: window.innerHeight,
    attachNode: "#canvas",
  });
  
  const makeBall = ({ startPosition, startVelocity, radius }) => {
    const gravity = 0.1;
    let position = { ...startPosition };
    let velocity = { ...startVelocity };
    const color = [pink, red, yellow, turquoise, white][
      Math.floor(Math.random() * 5)
    ];
  
    const update = () => {
      position.x += velocity.x;
      position.y += velocity.y;
      velocity.y += gravity;
  
      if (position.x > canvasWidth - radius) {
        position.x = canvasWidth - radius;
        velocity.x *= -1;
      } else if (position.x < radius) {
        position.x = radius;
        velocity.x *= -1;
      }
      if (position.y > canvasHeight - radius) {
        position.y = canvasHeight - radius;
        velocity.y *= -0.7;
      } else if (position.y < radius) {
        position.y = radius + 1;
        velocity.y *= -0.7;
      }
    };
  
    const draw = () => {
      CTX.fillStyle = color;
      CTX.beginPath();
      CTX.arc(position.x, position.y, radius, 0, 2 * Math.PI);
      CTX.fill();
    };
  
    return {
      update,
      draw,
      getPosition: () => position,
      getVelocity: () => velocity,
      getRadius: () => radius,
      setPosition: (passedPosition) => (position = passedPosition),
      setVelocity: (passedVelocity) => (velocity = passedVelocity),
    };
  };
  
  const checkCollision = (ballA, ballB) => {
    const rSum = ballA.getRadius() + ballB.getRadius();
    const dx = ballB.getPosition().x - ballA.getPosition().x;
    const dy = ballB.getPosition().y - ballA.getPosition().y;
    return [rSum * rSum > dx * dx + dy * dy, rSum - Math.sqrt(dx * dx + dy * dy)];
  };
  
  const resolveCollision = (ballA, ballB) => {
    const relativeVelocity = {
      x: ballB.getVelocity().x - ballA.getVelocity().x,
      y: ballB.getVelocity().y - ballA.getVelocity().y,
    };
  
    const norm = {
      x: ballB.getPosition().x - ballA.getPosition().x,
      y: ballB.getPosition().y - ballA.getPosition().y,
    };
    const mag = Math.sqrt(norm.x * norm.x + norm.y * norm.y);
    norm.x /= mag;
    norm.y /= mag;
  
    const velocityAlongNorm =
      relativeVelocity.x * norm.x + relativeVelocity.y * norm.y;
  
    if (velocityAlongNorm > 0) return;
  
    const bounce = 0.7;
    let j = -(1 + bounce) * velocityAlongNorm;
    j /= 1 / ballA.getRadius() + 1 / ballB.getRadius();
    const impulse = { x: j * norm.x, y: j * norm.y };
  
    ballA.setVelocity({
      x: ballA.getVelocity().x - (1 / ballA.getRadius()) * impulse.x,
      y: ballA.getVelocity().y - (1 / ballA.getRadius()) * impulse.y,
    });
  
    ballB.setVelocity({
      x: ballB.getVelocity().x + (1 / ballB.getRadius()) * impulse.x,
      y: ballB.getVelocity().y + (1 / ballB.getRadius()) * impulse.y,
    });
  };
  
  const adjustPositions = (ballA, ballB, depth) => {
    const percent = 0.2;
    const slop = 0.01;
    let correctionNum =
      (Math.max(depth - slop, 0) /
        (1 / ballA.getRadius() + 1 / ballB.getRadius())) *
      percent;
  
    const norm = {
      x: ballB.getPosition().x - ballA.getPosition().x,
      y: ballB.getPosition().y - ballA.getPosition().y,
    };
    const mag = Math.sqrt(norm.x * norm.x + norm.y * norm.y);
    norm.x /= mag;
    norm.y /= mag;
  
    const correction = { x: correctionNum * norm.x, y: correctionNum * norm.y };
  
    ballA.setPosition({
      x: ballA.getPosition().x - (1 / ballA.getRadius()) * correction.x,
      y: ballA.getPosition().y - (1 / ballA.getRadius()) * correction.y,
    });
    ballB.setPosition({
      x: ballB.getPosition().x + (1 / ballB.getRadius()) * correction.x,
      y: ballB.getPosition().y + (1 / ballB.getRadius()) * correction.y,
    });
  };
  
  const balls = new Array(7).fill().map(() =>
    makeBall({
      startPosition: {
        x: randomBetween(canvasWidth / 8, canvasWidth - canvasWidth / 8),
        y: randomBetween(canvasHeight / 8, canvasHeight - canvasHeight / 8),
      },
      startVelocity: { x: randomBetween(-12, 12), y: randomBetween(-12, -4) },
      radius: Math.min(canvasHeight, canvasWidth) / 16,
    })
  );
  
  animate(() => {
    CTX.clearRect(0, 0, canvasWidth, canvasHeight);
  
    balls.forEach((ballA) => {
      ballA.update();
      balls.forEach((ballB) => {
        if (ballA !== ballB) {
          const collision = checkCollision(ballA, ballB);
          if (collision[0]) {
            adjustPositions(ballA, ballB, collision[1]);
            resolveCollision(ballA, ballB);
          }
        }
      });
    });
  
    balls.forEach((b) => b.draw());
  });