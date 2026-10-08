import React, { useEffect } from 'react';

export const OrnateFrame: React.FC = () => {
  useEffect(() => {
    // Generate the authentic SVG corner ornament masks dynamically
    const ornSvg = (x: number, y: number) =>
      `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><g transform='translate(${x < 0 ? 40 : 0} ${
          y < 0 ? 40 : 0
        }) scale(${x} ${y})' fill='none' stroke='black' stroke-width='1.6'><path d='M2 38V9Q2 2 9 2H38'/><path d='M7 33V13Q7 7 13 7H33' stroke-width='.8'/><path d='M12 12c7 0 11 4 11 9s-6 8-9 4 2-7 5-4'/><path d='M12 12c0 7 4 11 9 11' stroke-width='.8'/><circle cx='4' cy='4' r='2.2' fill='black'/></g></svg>`
      )}")`;

    const root = document.documentElement;
    root.style.setProperty('--o1', ornSvg(1, 1));
    root.style.setProperty('--o2', ornSvg(-1, 1));
    root.style.setProperty('--o3', ornSvg(1, -1));
    root.style.setProperty('--o4', ornSvg(-1, -1));
  }, []);

  return <div id="frame" aria-hidden="true" />;
};
