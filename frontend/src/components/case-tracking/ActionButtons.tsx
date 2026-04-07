import { motion } from 'framer-motion';
import { Monitor, HeadphonesIcon } from 'lucide-react';
import { Button } from "../ui/button";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const ActionButtons = () => {
  const actions = [
    {
      icon: Monitor,
      label: 'View at Kiosk',
      variant: 'default' as const
    },
    {
      icon: HeadphonesIcon,
      label: 'Get Help',
      variant: 'outline' as const
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 max-w-md"
    >
      {actions.map((action, index) => (
        <motion.div key={index} variants={itemVariants}>
          <Button
            variant={action.variant}
            className={`
              w-full h-auto py-4 px-6 flex items-center justify-center gap-3 rounded-xl
              transition-all duration-300 hover:scale-[1.02]
              ${action.variant === 'default' ? 'bg-primary hover:bg-primary/90' : ''}
              ${action.variant === 'outline' ? 'border-border hover:bg-muted hover:border-primary/30' : ''}
            `}
          >
            <action.icon className="w-5 h-5" />
            <span className="font-semibold">{action.label}</span>
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
};
