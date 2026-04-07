import { motion } from 'framer-motion';
import { Building2, MapPin, Calendar, Users } from 'lucide-react';
import { CaseData } from '@/types/case';

interface KeyDetailsGridProps {
  caseData: CaseData;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const KeyDetailsGrid = ({ caseData }: KeyDetailsGridProps) => {
  const details = [
    {
      icon: Building2,
      label: 'Court Name',
      value: caseData.courtName,
      color: 'text-primary',
      bgColor: 'bg-primary/10 border-primary/20'
    },
    {
      icon: MapPin,
      label: 'State / District',
      value: `${caseData.state}, ${caseData.district}`,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10 border-secondary/20'
    },
    {
      icon: Calendar,
      label: 'Next Hearing Date',
      value: caseData.nextHearingDate,
      color: 'text-warning',
      bgColor: 'bg-warning/10 border-warning/20'
    },
    {
      icon: Users,
      label: 'Presiding Bench',
      value: caseData.presidingBench,
      color: 'text-primary',
      bgColor: 'bg-primary/10 border-primary/20'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {details.map((detail, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          whileHover={{ scale: 1.02, y: -2 }}
          className="card-glow rounded-xl bg-card border border-border p-5 transition-all duration-300"
        >
          <div className={`inline-flex p-2.5 rounded-lg ${detail.bgColor} border mb-4`}>
            <detail.icon className={`w-5 h-5 ${detail.color}`} />
          </div>
          <p className="text-sm text-muted-foreground mb-1">{detail.label}</p>
          <p className="text-base font-semibold text-foreground">{detail.value}</p>
        </motion.div>
      ))}
    </motion.div>
  );
};
