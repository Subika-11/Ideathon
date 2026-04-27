import { motion } from 'framer-motion';
import { Scale, Hash, User, Building2 } from 'lucide-react';
import { CaseData } from '@/types/case';

interface CaseSummaryCardProps {
  caseData: CaseData;
}

const statusConfig = {
  active: { label: 'Active', className: 'badge-active' },
  hearing: { label: 'Under Hearing', className: 'badge-hearing' },
  closed: { label: 'Closed', className: 'badge-closed' },
} as const;

export const CaseSummaryCard = ({ caseData }: CaseSummaryCardProps) => {
  const status = statusConfig[caseData.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card-glow rounded-2xl bg-card border border-border p-6 md:p-8"
    >
      {/* Header with Title and Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="p-3 rounded-xl bg-primary/10 border border-primary/20"
          >
            <Scale className="w-6 h-6 text-primary" />
          </motion.div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">
            {caseData.title}
          </h2>
        </div>

        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${status.className}`}
        >
          <motion.span 
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-current" 
          />
          {status.label}
        </motion.span>
      </div>

      {/* Party Names - Petitioner vs Respondent */}
      <div className="relative flex flex-col md:flex-row items-stretch gap-4 md:gap-0">
        {/* Petitioner */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          whileHover={{ scale: 1.02 }}
          className="flex-1 p-5 rounded-xl bg-primary/5 border border-primary/20 md:rounded-r-none"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="p-3 rounded-lg bg-primary/20"
            >
              <User className="w-5 h-5 text-primary" />
            </motion.div>
            <div>
              <p className="text-xs text-primary/70 uppercase tracking-wider font-medium mb-1">Petitioner</p>
              <motion.p 
                className="text-xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {caseData.petitioner}
              </motion.p>
            </div>
          </div>
        </motion.div>

        {/* VS Badge - Center */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 md:relative md:left-auto md:top-auto md:translate-x-0 md:translate-y-0 md:flex md:items-center md:-mx-4"
        >
          <div className="px-4 py-2 rounded-full bg-card border-2 border-border shadow-lg">
            <span className="text-lg font-bold text-gradient">VS</span>
          </div>
        </motion.div>

        {/* Respondent */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
          whileHover={{ scale: 1.02 }}
          className="flex-1 p-5 rounded-xl bg-secondary/5 border border-secondary/20 md:rounded-l-none"
        >
          <div className="flex items-center gap-4 md:justify-end md:text-right">
            <div className="md:order-2">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="p-3 rounded-lg bg-secondary/20"
              >
                <Building2 className="w-5 h-5 text-secondary" />
              </motion.div>
            </div>
            <div className="md:order-1">
              <p className="text-xs text-secondary/70 uppercase tracking-wider font-medium mb-1">Respondent</p>
              <motion.p 
                className="text-xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {caseData.respondent}
              </motion.p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CNR Display */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border mt-6"
      >
        <Hash className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">CNR:</span>
        <span className="font-montserrat text-foreground tracking-wider">
          {caseData.cnr}
        </span>
      </motion.div>
    </motion.div>
  );
};
