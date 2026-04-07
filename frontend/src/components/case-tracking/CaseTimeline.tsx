import { motion } from 'framer-motion';
import { FileText, Gavel, FileCheck, Calendar, CheckCircle2 } from 'lucide-react';
import { TimelineEvent } from '@/types/case';

interface CaseTimelineProps {
  events: TimelineEvent[];
}

const iconMap = {
  filed: FileText,
  hearing: Gavel,
  evidence: FileCheck,
  scheduled: Calendar,
  order: CheckCircle2
} as const;

const statusStyles = {
  completed: 'bg-primary text-primary-foreground border-primary',
  active: 'bg-primary text-primary-foreground border-primary animate-pulse-glow',
  pending: 'bg-muted text-muted-foreground border-border'
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: { opacity: 1, x: 0 }
};

export const CaseTimeline = ({ events }: CaseTimelineProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card-glow rounded-2xl bg-card border border-border p-6 md:p-8"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
        <div className="w-1 h-6 rounded-full bg-primary" />
        Case Timeline
      </h3>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative"
      >
        {events.map((event, index) => {
          const Icon = iconMap[event.type] || FileText;
          const isLast = index === events.length - 1;
          const isActive = event.status === 'active';

          return (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`relative flex gap-4 ${!isLast ? 'pb-8' : ''}`}
            >
              {/* Vertical line */}
              {!isLast && (
                <div 
                  className={`absolute left-5 top-12 w-0.5 h-full -translate-x-1/2 ${
                    event.status === 'completed' ? 'bg-primary' : 'bg-border'
                  }`}
                />
              )}

              {/* Icon node */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                className={`
                  relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                  ${statusStyles[event.status]}
                `}
              >
                <Icon className="w-4 h-4" />
                {isActive && (
                  <motion.div
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full border-2 border-primary"
                  />
                )}
              </motion.div>

              {/* Content */}
              <div className="flex-1 pt-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                  <h4 className={`font-medium ${
                    event.status === 'pending' ? 'text-muted-foreground' : 'text-foreground'
                  }`}>
                    {event.title}
                  </h4>
                  <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit
                    ${event.status === 'completed' ? 'badge-active' : 
                      event.status === 'active' ? 'badge-hearing' : 'bg-muted text-muted-foreground'}
                  `}>
                    {event.status === 'completed' ? 'Completed' : 
                     event.status === 'active' ? 'Current' : 'Upcoming'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{event.date}</p>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
};
