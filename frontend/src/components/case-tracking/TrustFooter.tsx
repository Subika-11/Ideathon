import { motion } from 'framer-motion';
import { Shield, Fingerprint } from 'lucide-react';

export const TrustFooter = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-12 pt-6 border-t border-border"
    >
      <div className="flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-muted-foreground/70 text-sm">
          <Shield className="w-4 h-4 text-primary" />
          <span>Verified Records</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground/70 text-sm">
          <Fingerprint className="w-4 h-4 text-secondary" />
          <span>Secure Access</span>
        </div>
      </div>
    </motion.footer>
  );
};
