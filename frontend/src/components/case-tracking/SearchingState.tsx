import { motion } from 'framer-motion';
import { Database, Shield, Server } from 'lucide-react';

export const SearchingState = () => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-20"
    >
      {/* Animated Icon Stack */}
      <div className="relative w-32 h-32 mb-8">
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
        />
        
        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 rounded-full border-2 border-dotted border-secondary/40"
        />
        
        {/* Center icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            boxShadow: [
              '0 0 20px hsl(var(--primary) / 0.3)',
              '0 0 40px hsl(var(--primary) / 0.5)',
              '0 0 20px hsl(var(--primary) / 0.3)'
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-8 rounded-full bg-card flex items-center justify-center border border-primary/50"
        >
          <Database className="w-8 h-8 text-primary" />
        </motion.div>

        {/* Orbiting icons */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 p-2 bg-card rounded-full border border-border">
            <Shield className="w-4 h-4 text-secondary" />
          </div>
        </motion.div>

        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0"
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 p-2 bg-card rounded-full border border-border">
            <Server className="w-4 h-4 text-primary" />
          </div>
        </motion.div>
      </div>

      {/* Pulsing text */}
      <motion.h3
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="text-xl font-semibold text-foreground mb-2"
      >
        Searching records…
      </motion.h3>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground"
      >
        Verifying case authenticity
      </motion.p>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 1, 0.3]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-2 h-2 rounded-full bg-primary"
          />
        ))}
      </div>
    </motion.div>
  );
};
