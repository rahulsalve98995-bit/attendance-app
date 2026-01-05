import { motion } from 'framer-motion';

export default function LoadingSpinner({ size = 40 }: { size?: number }) {
  return (
    <div className="flex justify-center items-center">
      <motion.div
        className="border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full"
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}