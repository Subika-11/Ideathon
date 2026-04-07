import { motion } from 'framer-motion';
import { Bell, Calendar, FileWarning, Users } from 'lucide-react';
import { Reminder } from '@/types/case';

interface RemindersCardProps {
  reminders: Reminder[];
}

const iconMap = {
  hearing: Calendar,
  document: FileWarning,
  meeting: Users
} as const;

const colorMap = {
  hearing: 'text-secondary bg-secondary/10 border-secondary/20',
  document: 'text-warning bg-warning/10 border-warning/20',
  meeting: 'text-primary bg-primary/10 border-primary/20'
} as const;

export const RemindersCard = ({ reminders }: RemindersCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="card-glow rounded-2xl bg-card border border-border p-6 md:p-8"
    >
      <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        Important Reminders
      </h3>

      <div className="space-y-4">
        {reminders.map((reminder, index) => {
          const Icon = iconMap[reminder.type] || Calendar;
          const colorClass = colorMap[reminder.type] || colorMap.hearing;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ x: 4 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/30 transition-colors"
            >
              <div className={`p-2.5 rounded-lg border ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground mb-0.5">{reminder.title}</h4>
                <p className="text-sm text-muted-foreground">{reminder.date}</p>
                {reminder.description && (
                  <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                )}
              </div>
              {reminder.urgent && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                  Urgent
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
