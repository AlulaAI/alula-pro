import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SwipeIndicatorProps {
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  isVisible: boolean;
}

export function SwipeIndicator({ canSwipeLeft, canSwipeRight, isVisible }: SwipeIndicatorProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Left Swipe Indicator */}
          {canSwipeRight && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent w-16 h-32 rounded-r-full" />
                <motion.div
                  animate={{ x: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="relative z-10 p-2"
                >
                  <ChevronLeft className="h-6 w-6 text-gray-600" />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Right Swipe Indicator */}
          {canSwipeLeft && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent w-16 h-32 rounded-l-full" />
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="relative z-10 p-2"
                >
                  <ChevronRight className="h-6 w-6 text-gray-600" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}