/**
 * Shared animation variants for portal UI (stagger lists, etc.).
 * All variants support reduced motion: when reducedMotion is true, animations are instant (duration 0, no stagger).
 */

const STAGGER_CHILDREN = 0.06
const DELAY_CHILDREN = 0.04
const ITEM_DURATION = 0.2
const ITEM_OFFSET = 6

/**
 * Returns stagger list variants for Framer Motion.
 * Use with a motion container (initial="hidden", animate="visible", variants={container})
 * and motion children (variants={item}).
 *
 * @param {boolean} [reducedMotion=false] - When true, no stagger and zero duration (a11y).
 * @returns {{ container: object, item: object }}
 */
export function getStaggerListVariants(reducedMotion = false) {
  if (reducedMotion) {
    return {
      container: {
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0, delayChildren: 0 },
        },
      },
      item: {
        hidden: { opacity: 1, x: 0 },
        visible: {
          opacity: 1,
          x: 0,
          transition: { duration: 0 },
        },
      },
    }
  }
  return {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: STAGGER_CHILDREN,
          delayChildren: DELAY_CHILDREN,
        },
      },
    },
    item: {
      hidden: { opacity: 0, x: -ITEM_OFFSET },
      visible: {
        opacity: 1,
        x: 0,
        transition: {
          duration: ITEM_DURATION,
          ease: [0.25, 0.1, 0.25, 1],
        },
      },
    },
  }
}
