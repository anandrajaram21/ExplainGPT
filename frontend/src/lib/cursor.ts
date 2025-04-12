export function initCustomCursor() {
  if (typeof window === 'undefined') return;
  
  const handleMouseMove = (e: MouseEvent) => {
    document.body.style.setProperty('--cursor-x', `${e.clientX}px`);
    document.body.style.setProperty('--cursor-y', `${e.clientY}px`);
    
    const cursorDot = document.querySelector('body::after') as HTMLElement;
    if (cursorDot) {
      cursorDot.style.top = `${e.clientY}px`;
      cursorDot.style.left = `${e.clientX}px`;
    }
  };
  
  window.addEventListener('mousemove', handleMouseMove);
  
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
  };
} 