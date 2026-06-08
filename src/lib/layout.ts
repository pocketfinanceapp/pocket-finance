/** Bottom navigation bar height — fixed, matches BottomNav + MobilePageShell */
export const BOTTOM_NAV_PX = 65;

export const BOTTOM_NAV_HEIGHT = `${BOTTOM_NAV_PX}px`;

/** Trending Now strip above swipeable feed cards */
export const TRENDING_NOW_HEIGHT = 280;

/** Feed viewport — full area below bottom nav */
export const FEED_VIEWPORT_HEIGHT = `calc(100svh - ${BOTTOM_NAV_PX}px)`;

/** Single swipeable feed card height (viewport minus trending strip) */
export const FEED_CARD_HEIGHT = `calc(100svh - ${BOTTOM_NAV_PX}px - ${TRENDING_NOW_HEIGHT}px)`;
