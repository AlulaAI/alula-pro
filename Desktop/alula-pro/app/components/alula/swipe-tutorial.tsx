import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

interface SwipeTutorialProps {
  show: boolean;
  onDismiss: () => void;
}

export function SwipeTutorial({ show, onDismiss }: SwipeTutorialProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (show) {
      setStep(0);
      const timer = setTimeout(() => setStep(1), 1500);
      return () => clearTimeout(timer);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Swipe to Navigate</h3>
              <button
                onClick={onDismiss}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="relative h-48 mb-6">
              {/* Phone Frame */}
              <div className="absolute inset-0 bg-gray-100 rounded-2xl border-4 border-gray-300 overflow-hidden">
                <div className="h-full relative">
                  {/* Mock Card */}
                  <motion.div
                    animate={{
                      x: step === 0 ? 0 : step === 1 ? -100 : 100,
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="absolute inset-4 bg-white rounded-xl shadow-md p-4"
                  >
                    <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-gray-100 rounded w-full mb-1" />
                    <div className="h-2 bg-gray-100 rounded w-5/6" />
                  </motion.div>

                  {/* Gesture Indicator */}
                  <AnimatePresence>
                    {step === 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: -50 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.5 }}
                        className="absolute top-1/2 left-1/2 -translate-y-1/2"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl">👆</span>
                          </div>
                          <div className="text-blue-500 text-2xl">←</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-gray-700 font-medium">
                {step === 0 ? "Swipe left to see the next task" : "Swipe right to go back"}
              </p>
              <p className="text-sm text-gray-500">
                Navigate through tasks with simple gestures
              </p>
            </div>

            <button
              onClick={onDismiss}
              className="w-full mt-6 bg-[#87CEEB] text-[#10292E] font-medium py-3 rounded-xl hover:bg-[#87CEEB]/90 transition-colors"
            >
              Got it!
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}