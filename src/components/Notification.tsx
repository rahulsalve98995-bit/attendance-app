import { motion, AnimatePresence } from 'framer-motion';

interface NotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export default function Notification({ message, type = 'info', onClose }: NotificationProps) {
  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }[type];

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${bgColor} max-w-sm`}
        >
          <div className="flex justify-between items-center">
            <p>{message}</p>
            <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}