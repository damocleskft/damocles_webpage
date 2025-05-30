// Ellenőrzi, hogy az elem a viewportban van-e
function isInViewport(element) {
  var elementTop = $(element).offset().top;
  var elementBottom = elementTop + $(element).outerHeight();
  var viewportTop = $(window).scrollTop();
  var viewportBottom = viewportTop + $(window).height();
  return elementBottom > viewportTop && elementTop < viewportBottom;
}

var counterAnimated = false;

$(window).on('scroll resize', function () {
  $('.counter').each(function () {
    if (isInViewport(this) && !$(this).data('animated')) {
      $(this).data('animated', true);
      $(this).prop('Counter', 0).animate({
        Counter: $(this).text()
      }, {
        duration: 1500,
        easing: 'swing',
        step: function (now) {
          $(this).text(Math.ceil(now));
        }
      });
    }
  });
});

// Ha az oldal betöltésekor már látható az elem, akkor is elindítjuk
$(document).ready(function () {
  $(window).trigger('scroll');
});

function animateOnVisible(className) {
  const elements = document.querySelectorAll(`.${className}`);

  // Alapértelmezett CSS osztály hozzáadása az elemekhez az induló állapothoz
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  });

  // Intersection Observer létrehozása
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        // Animáció alkalmazása: áttűnés és felfelé mozgás
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        // Miután animáltuk, nem kell tovább figyelni az elemet
        observer.unobserve(el);
      }
    });
  }, {
    threshold: 0.01 // Akkor aktiválódik, ha az elem legalább 1%-ban látható
  });

  // Megfigyelés indítása minden elemre
  elements.forEach(el => observer.observe(el));
}


function animateOnVisibleStaggered(className, delayStep = 150) {
  const elements = Array.from(document.querySelectorAll(`.${className}`));

  // Alapértelmezett stílus beállítása
  elements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px)';
    el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
  });

  // Intersection Observer
  const observer = new IntersectionObserver((entries, observer) => {
    // Ha bármelyik elem láthatóvá válik, minden elem animációját elindítjuk, késleltetve
    if (entries.some(entry => entry.isIntersecting)) {
      elements.forEach((el, i) => {
        setTimeout(() => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        }, i * delayStep);
      });
      // Megfigyelés leállítása
      elements.forEach(el => observer.unobserve(el));
    }
  }, { threshold: 0.3 });

  // Figyelés indítása csak az első elemre (hogy egyszerre induljon minden)
  if (elements.length) observer.observe(elements[0]);
}

animateOnVisibleStaggered('why-card', 50);

document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('testimonialsContainer');
  const track = document.getElementById('testimonialsTrack');

  if (!container || !track) return;

  let currentPosition = 0;
  let targetSpeed = 0;
  let currentSpeed = 0;
  let animationId = null;
  let isMouseInside = false;

  // Eredeti kártyák
  const originalCards = Array.from(track.children);
  const cardWidth = 350 + 32; // kártya + gap
  const totalOriginalWidth = originalCards.length * cardWidth;

  // Duplikáljuk a kártyákat háromszor a seamless loophoz
  function setupInfiniteLoop() {
    // Töröljük a meglévő klónokat
    track.innerHTML = '';

    // Hozzáadjuk az eredeti kártyákat háromszor
    for (let i = 0; i < 3; i++) {
      originalCards.forEach(card => {
        const clone = card.cloneNode(true);
        track.appendChild(clone);
      });
    }

    // Kezdő pozíció a középső szett elejére
    currentPosition = -totalOriginalWidth;
    track.style.transform = `translateX(${currentPosition}px)`;
  }

  function updatePosition() {
    // Smooth interpolation
    currentSpeed += (targetSpeed - currentSpeed) * 0.08;

    if (Math.abs(currentSpeed) > 0.01) {
      currentPosition += currentSpeed;

      // Seamless loop logic - nincs hirtelen ugrás
      if (currentPosition <= -totalOriginalWidth * 2) {
        // Ha túl messze mentünk jobbra, visszatérünk a középső szetthez
        currentPosition += totalOriginalWidth;
      } else if (currentPosition >= 0) {
        // Ha túl messze mentünk balra, visszatérünk a középső szetthez
        currentPosition -= totalOriginalWidth;
      }

      track.style.transform = `translateX(${currentPosition}px)`;
    }
  }

  function animate() {
    updatePosition();

    if (Math.abs(currentSpeed) > 0.01 || targetSpeed !== 0) {
      animationId = requestAnimationFrame(animate);
    } else {
      animationId = null;
    }
  }

  function startAnimation() {
    if (!animationId) {
      animationId = requestAnimationFrame(animate);
    }
  }

  function setSpeed(speed) {
    targetSpeed = speed;
    startAnimation();
  }

  // Egér események
  let mouseMoveTimeout;

  container.addEventListener('mouseenter', function () {
    isMouseInside = true;
  });

  container.addEventListener('mouseleave', function () {
    isMouseInside = false;
    setSpeed(-1); // Alapértelmezett jobbra mozgás
  });

  container.addEventListener('mousemove', function (e) {
    if (!isMouseInside) return;

    clearTimeout(mouseMoveTimeout);
    mouseMoveTimeout = setTimeout(() => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const containerWidth = rect.width;
      const centerZone = containerWidth * 0.4; // 40% középső zóna
      const leftZone = (containerWidth - centerZone) / 2;
      const rightZone = leftZone + centerZone;

      if (mouseX < leftZone) {
        // Bal oldal - balra mozgás
        const intensity = Math.min((leftZone - mouseX) / leftZone, 1);
        setSpeed(intensity * 3);
      } else if (mouseX > rightZone) {
        // Jobb oldal - jobbra mozgás
        const intensity = Math.min((mouseX - rightZone) / leftZone, 1);
        setSpeed(-intensity * 3);
      } else {
        // Középen megáll
        setSpeed(0);
      }
    }, 16);
  });

  // Inicializálás
  setupInfiniteLoop();
  setSpeed(-1);

  // Cleanup
  window.addEventListener('beforeunload', function () {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const navbarToggler = document.querySelector('.navbar-toggler');
  const icon = document.querySelector('.navbar-toggler-icon-custom');

  navbarToggler.addEventListener('click', function () {
    // Kis késleltetés a Bootstrap animáció szinkronizálásához
    setTimeout(() => {
      const isExpanded = navbarToggler.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        icon.style.transform = 'rotate(90deg)';
      } else {
        icon.style.transform = 'rotate(0deg)';
      }
    }, 50);
  });
});

// Laptop screen typing animation
document.addEventListener('DOMContentLoaded', function () {
  const screenText = document.getElementById('screenText');

  if (!screenText) return;

  const messages = [
    "Hálózat stabil.",
    "Rendszer naprakész.",
    "Védelem aktív.",
    "Támogatás online.",
    "VPN kapcsolódás..."
  ];

  let currentMessageIndex = 0;
  let currentCharIndex = 0;
  let isDeleting = false;
  let isPaused = false;

  function typeWriter() {
    const currentMessage = messages[currentMessageIndex];

    if (!isDeleting && !isPaused) {
      // Typing
      if (currentCharIndex < currentMessage.length) {
        const char = currentMessage.charAt(currentCharIndex);

        // Space karakter esetén &nbsp; használata
        const displayChar = char === ' ' ? '&nbsp;' : char;

        const span = document.createElement('span');
        span.className = 'typing-char';
        span.innerHTML = displayChar; // innerHTML használata &nbsp; miatt

        screenText.appendChild(span);
        currentCharIndex++;

        // Space esetén gyorsabb typing
        const delay = char === ' ' ? 50 : 100;
        setTimeout(typeWriter, delay);
      } else {
        // Message complete, pause before deleting
        isPaused = true;
        setTimeout(() => {
          isPaused = false;
          isDeleting = true;
          typeWriter();
        }, 2000); // Pause duration
      }
    } else if (isDeleting && !isPaused) {
      // Deleting
      if (currentCharIndex > 0) {
        const chars = screenText.querySelectorAll('.typing-char');
        if (chars.length > 0) {
          screenText.removeChild(chars[chars.length - 1]);
        }
        currentCharIndex--;

        setTimeout(typeWriter, 50); // Delete speed
      } else {
        // Deletion complete, move to next message
        isDeleting = false;
        currentMessageIndex = (currentMessageIndex + 1) % messages.length;

        setTimeout(typeWriter, 500); // Pause before next message
      }
    }

    // Add cursor
    const existingCursor = screenText.querySelector('.cursor');
    if (existingCursor) {
      existingCursor.remove();
    }

    const cursor = document.createElement('span');
    cursor.className = 'cursor';
    screenText.appendChild(cursor);
  }

  // Start the animation
  setTimeout(typeWriter, 1000); // Initial delay
});


function throttle(func, limit) {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const heroElement = document.querySelector('.hero-bg');

  // Helyes CSS transition szintaxis
  heroElement.style.transition = 'background-position-y 0.3s ease-out';

  const handleMouseMove = throttle(function (e) {
    let mouseY = e.clientY;
    let windowHeight = window.innerHeight;

    // Egér pozíció százalékban (0-100%)
    let mousePercentY = (mouseY / windowHeight) * 100;

    // Background position Y használata
    heroElement.style.backgroundPositionY = `${mousePercentY}%`;
  }, 16);

  document.addEventListener('mousemove', handleMouseMove);
});


document.addEventListener('DOMContentLoaded', function () {
  const serviceCards = document.querySelectorAll('.service-card');
  let activeCard = null;

  serviceCards.forEach(card => {
    card.addEventListener('click', function (e) {
      e.preventDefault();

      // Ha ugyanarra a kártyára kattintunk, zárjuk be
      if (activeCard === this) {
        closeCard(this);
        activeCard = null;
        return;
      }

      // Ha van aktív kártya, zárjuk be
      if (activeCard) {
        closeCard(activeCard);
      }

      // Nyissuk meg az új kártyát
      openCard(this);
      activeCard = this;
    });
  });

  function openCard(card) {
    // Animáció késleltetéssel a smooth effektért
    setTimeout(() => {
      card.classList.add('expanded');
    }, 10);

    // Smooth scroll a kártyához
    setTimeout(() => {
      card.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 100);
  }

  function closeCard(card) {
    setTimeout(() => {
      card.classList.remove('expanded');
    }, 250);
  }

  // ESC billentyűvel bezárás
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && activeCard) {
      closeCard(activeCard);
      activeCard = null;
    }
  });

  // Kívülre kattintással bezárás (opcionális)
  document.addEventListener('click', function (e) {
    if (activeCard && !activeCard.contains(e.target)) {
      closeCard(activeCard);
      activeCard = null;
    }
  });
});
