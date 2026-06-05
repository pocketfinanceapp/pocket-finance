/** Bottom navigation bar height — fixed, matches BottomNav + MobilePageShell */
export const BOTTOM_NAV_PX = 65;

export const BOTTOM_NAV_HEIGHT = `${BOTTOM_NAV_PX}px`;

/** Feed viewport / card height — pure CSS, no JS measurement */
export const FEED_VIEWPORT_HEIGHT = `calc(100svh - ${BOTTOM_NAV_PX}px)`;
