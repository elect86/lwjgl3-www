import React, { useEffect, useState, useRef } from 'react';
import { css } from '@emotion/css';
import { Link } from '@reach/router';
import { useBreakpoint } from '~/components/Breakpoint';
import { SUPPORTS_PASSIVE_EVENTS } from '~/services/supports';
import { IS_IOS } from '~/services/ua';
import { cx } from '@emotion/css';
import { mediaBreakpointUp } from '~/theme/media';
import { Icon, CloudDownload } from '~/components/icons';
import { useServiceWorker } from '~/hooks/useServiceWorker';
import { MainMenu } from './MainMenu';
import { Sidebar } from './Sidebar';

import type { RouteComponentProps } from '@reach/router';

const HEADER_CLASSNAME = 'site-header';
const cssIsHome = css`
  transition: background-color 0.75s ease-out;
`;
const cssOpaque = css`
  background-color: black;

  ${mediaBreakpointUp('lg')} {
    background-color: #1b2426;
  }
`;

function ServiceWorkerUpdate() {
  const [pending, update] = useServiceWorker();

  return pending ? (
    <button
      onClick={update as any}
      className="btn btn-primary btn-sm present-yourself py-0 px-1 ml-3"
      title="Update website to latest version"
    >
      <Icon children={<CloudDownload />} />
    </button>
  ) : null;
}

let offsetHeight = 48;

export const Header: React.FC<RouteComponentProps> = ({ location }) => {
  const isHome = location !== undefined && location.pathname === '/';
  const {
    current: currentBreakpoint,
    breakpoints: { md },
  } = useBreakpoint();
  const [pos, setPos] = useState(0);
  const [top, setTop] = useState(true);
  const [fixed, setFixed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const menu = useRef<HTMLElement>(null);

  useEffect(() => {
    // Measure menu height, should be ~ 48 pixels
    if (menu.current !== null) {
      offsetHeight = menu.current.offsetHeight;
    }
  }, []);

  useEffect(() => {
    enum Direction {
      Up,
      Down,
    }

    // Re-create useState variables to prevent scope conflicts
    let pos = 0;
    let top = true;
    let fixed = false;
    let hidden = false;

    // Internal tracking
    let mounted = true;
    let prev = 0;
    let current = 0;
    let direction = Direction.Down;
    let ticking = false;

    function _setPos(value: number) {
      pos = value;
      setPos(value);
    }
    function _setTop(value: boolean) {
      top = value;
      setTop(value);
    }
    function _setFixed(value: boolean) {
      fixed = value;
      setFixed(value);
    }
    function _setHidden(value: boolean) {
      hidden = value;
      setHidden(value);
    }

    function update() {
      ticking = false;
      if (!mounted) {
        return;
      }
      prev = current;
      current = Math.max(0, window.pageYOffset);

      if (prev - current < 0) {
        // We are scrolling down
        if (IS_IOS) {
          if (!hidden) {
            _setHidden(true);
          }
        } else if (direction === Direction.Up) {
          // We just started scroll down
          direction = Direction.Down;
          if (fixed) {
            // Release menu from the top of the viewport
            _setFixed(false);
            _setPos(prev);
          }
        }

        if (current > offsetHeight && top) {
          _setTop(false);
        }
      } else {
        // We are scrolling up
        if (IS_IOS) {
          if (hidden) {
            _setHidden(false);
          }
        } else {
          if (direction === Direction.Down) {
            // We just started scrolling up
            direction = Direction.Up;
            if (prev - current > offsetHeight) {
              _setFixed(true);
              _setPos(0);
            } else if (pos + offsetHeight < prev) {
              _setPos(Math.max(0, prev - offsetHeight));
            }
          } else if (!fixed && current < pos) {
            // The entire menu has been revealed, fix it to the viewport
            _setFixed(true);
            _setPos(0);
          }
        }

        if (current <= offsetHeight && !top) {
          _setTop(true);
        }
      }
    }

    function onScroll() {
      if (!ticking && mounted) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, SUPPORTS_PASSIVE_EVENTS ? { passive: true } : false);
    return () => {
      window.removeEventListener('scroll', onScroll, false);
      mounted = false;
    };
  }, []);

  return (
    <header
      ref={menu}
      role="navigation"
      className={cx(HEADER_CLASSNAME, isHome && cssIsHome, (!isHome || !top) && cssOpaque, {
        alt: IS_IOS,
        fixed,
        hidden,
      })}
      style={{ top: pos }}
    >
      <nav className="container-fluid">
        <div className="row">
          <div className="col col-auto">
            <Link to="/">
              LW
              <b>JGL</b> 3
            </Link>
            <ServiceWorkerUpdate />
          </div>
          {currentBreakpoint > md ? <MainMenu className="main-menu-horizontal col" /> : <Sidebar />}
        </div>
      </nav>
    </header>
  );
};
